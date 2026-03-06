import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  completed: boolean;
  userId: string;
  createdAt: Timestamp | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSignal = signal<User | null>(null);
  user = computed(() => this.userSignal());
  isAuthenticated = computed(() => !!this.userSignal());

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.userSignal.set(user);
    });
  }

  async login() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed', error);
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  }
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private auth = inject(AuthService);
  private tasksSignal = signal<Task[]>([]);
  tasks = computed(() => this.tasksSignal());

  constructor() {
    this.initTasksListener();
  }

  private initTasksListener() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(
          collection(db, 'tasks'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        onSnapshot(q, (snapshot) => {
          const tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Task));
          this.tasksSignal.set(tasks);
        }, (error) => {
          console.error('Firestore Error:', error);
        });
      } else {
        this.tasksSignal.set([]);
      }
    });
  }

  async addTask(title: string, description = '') {
    const user = this.auth.user();
    if (!user) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        description,
        completed: false,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      this.handleFirestoreError(error, 'create', 'tasks');
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, updates);
    } catch (error) {
      this.handleFirestoreError(error, 'update', `tasks/${taskId}`);
    }
  }

  async deleteTask(taskId: string) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      this.handleFirestoreError(error, 'delete', `tasks/${taskId}`);
    }
  }

  private handleFirestoreError(error: unknown, operation: string, path: string) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const errInfo = {
      error: errMessage,
      operationType: operation,
      path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
      }
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
}

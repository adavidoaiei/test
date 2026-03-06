import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService, TaskService, Task } from './services';
import { GlobalErrorHandler } from './error-handler';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
    MatFormFieldModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  auth = inject(AuthService);
  taskService = inject(TaskService);
  errorHandler = inject(GlobalErrorHandler);
  private fb = inject(FormBuilder);

  taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(1000)]]
  });

  isAdding = signal(false);

  async onSubmit() {
    if (this.taskForm.valid) {
      const { title, description } = this.taskForm.value;
      await this.taskService.addTask(title!, description!);
      this.taskForm.reset();
      this.isAdding.set(false);
    }
  }

  async toggleComplete(task: Task) {
    if (task.id) {
      await this.taskService.updateTask(task.id, { completed: !task.completed });
    }
  }

  async deleteTask(taskId: string) {
    await this.taskService.deleteTask(taskId);
  }

  trackByTaskId(index: number, task: Task) {
    return task.id;
  }
}

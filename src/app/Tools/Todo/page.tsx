/**
 *  @FileID          app/Tools/Todo/page.tsx
 *  @Description     Todo List tool for creating and managing tasks
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.11
 *  -----------------------------------------------------------------------------
 *  @created 29/03/25 10:35 AM IST (Kolkata +5:30 UTC)
 *  @modified 29/03/25 10:35 AM IST (Kolkata +5:30 UTC)
 */

"use client";

import React, { useState, useEffect } from "react";
import "@Styles/Tools-Todo.sass";
import {
    Add,
    CheckCircleOutline,
    Delete,
    Edit,
    FormatListBulleted,
    Save
} from "@mui/icons-material";

// Define Todo item interface
interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

// Filter types for todo list
type FilterType = 'all' | 'active' | 'completed';

export default function TodoList() {
    // State for managing todos
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [inputText, setInputText] = useState<string>("");
    const [filter, setFilter] = useState<FilterType>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState<string>("");

    // Load todos from localStorage on initial render
    useEffect(() => {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            try {
                setTodos(JSON.parse(savedTodos));
            } catch (error) {
                console.error("Failed to parse saved todos:", error);
                // Initialize with empty array if parsing fails
                setTodos([]);
            }
        }
    }, []);

    // Save todos to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('todos', JSON.stringify(todos));
    }, [todos]);

    // Generate a unique ID for new todos
    const generateId = (): string => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    };

    // Add a new todo
    const addTodo = () => {
        if (inputText.trim() === "") return;

        const newTodo: TodoItem = {
            id: generateId(),
            text: inputText.trim(),
            completed: false,
            createdAt: Date.now()
        };

        setTodos([...todos, newTodo]);
        setInputText("");
    };

    // Handle input change for new todo
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
    };

    // Handle key press for adding todo with Enter key
    const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    };

    // Toggle todo completion status
    const toggleTodo = (id: string) => {
        setTodos(
            todos.map(todo =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        );
    };

    // Delete a todo
    const deleteTodo = (id: string) => {
        setTodos(todos.filter(todo => todo.id !== id));
        
        // If we're deleting the item being edited, clear editing state
        if (editingId === id) {
            setEditingId(null);
            setEditText("");
        }
    };

    // Start editing a todo
    const startEditing = (todo: TodoItem) => {
        setEditingId(todo.id);
        setEditText(todo.text);
    };

    // Save edited todo
    const saveEdit = () => {
        if (editingId === null) return;
        if (editText.trim() === "") {
            // If edit text is empty, delete the todo
            deleteTodo(editingId);
            return;
        }

        setTodos(
            todos.map(todo =>
                todo.id === editingId ? { ...todo, text: editText.trim() } : todo
            )
        );
        
        // Clear editing state
        setEditingId(null);
        setEditText("");
    };

    // Handle edit input change
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditText(e.target.value);
    };

    // Handle key press for editing
    const handleEditKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            // Cancel editing on Escape
            setEditingId(null);
            setEditText("");
        }
    };

    // Clear all completed todos
    const clearCompleted = () => {
        setTodos(todos.filter(todo => !todo.completed));
    };

    // Filter todos based on current filter
    const filteredTodos = todos.filter(todo => {
        if (filter === 'active') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        return true; // 'all' filter shows everything
    });

    // Stats for the todo list
    const completedCount = todos.filter(todo => todo.completed).length;
    const activeCount = todos.length - completedCount;

    return (
        <div className="Page TodoList">
            <h1 className="title">Todo List</h1>
            <p className="description">Create, manage, and save your tasks in one place</p>

            <div className="todo-container glass">
                <div className="todo-header">
                    <h2>Your Tasks</h2>
                    <div className="header-actions">
                        <FormatListBulleted />
                    </div>
                </div>

                {/* Todo Input */}
                <div className="todo-input-container">
                    <input
                        type="text"
                        className="todo-input"
                        placeholder="Add a new task..."
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyPress}
                    />
                    <button className="add-button" onClick={addTodo}>
                        <Add />
                    </button>
                </div>

                {/* Todo List */}
                <div className="todo-list">
                    {filteredTodos.length > 0 ? (
                        filteredTodos.map(todo => (
                            <div key={todo.id} className="todo-item">
                                <input
                                    type="checkbox"
                                    className="todo-checkbox"
                                    checked={todo.completed}
                                    onChange={() => toggleTodo(todo.id)}
                                />
                                
                                {editingId === todo.id ? (
                                    <input
                                        type="text"
                                        className="todo-input"
                                        value={editText}
                                        onChange={handleEditChange}
                                        onKeyDown={handleEditKeyPress}
                                        onBlur={saveEdit}
                                        autoFocus
                                    />
                                ) : (
                                    <span 
                                        className={`todo-text ${todo.completed ? 'completed' : ''}`}
                                    >
                                        {todo.text}
                                    </span>
                                )}
                                
                                <div className="todo-actions">
                                    {editingId === todo.id ? (
                                        <button
                                            className="todo-action"
                                            onClick={saveEdit}
                                        >
                                            <Save fontSize="small" />
                                        </button>
                                    ) : (
                                        <button
                                            className="todo-action"
                                            onClick={() => startEditing(todo)}
                                            disabled={todo.completed}
                                        >
                                            <Edit fontSize="small" />
                                        </button>
                                    )}
                                    
                                    <button
                                        className="todo-action delete"
                                        onClick={() => deleteTodo(todo.id)}
                                    >
                                        <Delete fontSize="small" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <CheckCircleOutline className="empty-icon" />
                            <div className="empty-text">No tasks to display</div>
                            <div className="empty-subtext">
                                {filter === 'all' 
                                    ? "Add a new task to get started!" 
                                    : `No ${filter} tasks found. Change the filter to see other tasks.`}
                            </div>
                        </div>
                    )}
                </div>

                {/* Todo Stats */}
                <div className="todo-stats">
                    <div className="stats-text">
                        <span>{activeCount}</span> item{activeCount !== 1 ? 's' : ''} left
                    </div>
                    
                    {completedCount > 0 && (
                        <button className="clear-completed" onClick={clearCompleted}>
                            Clear completed
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="todo-filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                        onClick={() => setFilter('active')}
                    >
                        Active
                    </button>
                    <button
                        className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        Completed
                    </button>
                </div>
            </div>
        </div>
    );
} 
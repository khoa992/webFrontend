import React from 'react';
import { connect } from 'react-redux';
import './TaskEdit.css';


class TaskEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      taskName: '',
      tags: '',
      newTagName: '',
    };
    this.handleAddTask = this.handleAddTask.bind(this);
    this.handleDeleteTask = this.handleDeleteTask.bind(this);
    this.handleModifyName = this.handleModifyName.bind(this);
    this.handleModifyTag = this.handleModifyTag.bind(this);
    this.handleAddTag = this.handleAddTag.bind(this);
  }

  componentDidMount() {
    this.fetchTags();
  }

  async fetchTags() {
    try {
      const response = await fetch('http://localhost:3010/tags');
      const tags = await response.json();
      this.props.initializeTags(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }

  async handleAddTask() {
    const { taskName, tags } = this.state;
    const { highestId } = this.props;
    const tagArray = tags.split(',').map(tag => tag.trim());
    const newId = highestId + 1;

    try {
      const addResponse = await fetch('http://localhost:3010/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: newId, name: taskName, tags: tagArray }),
      });
      const newTask = await addResponse.json();
      this.props.addTask(newTask.id, taskName, tagArray);
      this.setState({ taskName: '', tags: '' });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }

  handleAddTag(taskName) {
    const task = this.props.tasks[taskName];
    const newTag = this.state.newTagName.trim();
    if (newTag) {
      const newTags = [...task.tags, newTag];
      this.props.modifyTask(taskName, task.name, newTags);
      const highestTagId = this.props.tags.reduce((maxId, tag) => Math.max(maxId, tag.id), 0);
      this.props.addTag({ id: highestTagId + 1, name: newTag });
      this.setState({ newTagName: '' });
    }
  }

  async handleDeleteTask(taskName) {
    try {
      const task = this.props.tasks[taskName];
      if (!task) return;

      await fetch(`http://localhost:3010/tasks/${task.id}`, {
        method: 'DELETE',
      });

      this.props.deleteTask(taskName);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  async handleModifyName(taskName) {
    const task = this.props.tasks[taskName];
    if (!task) {
      return;
    }
    const newTaskName = prompt('Enter new task name:', taskName);
    if (newTaskName && newTaskName.trim() !== '') {
      try {
        await fetch(`http://localhost:3010/tasks/${task.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newTaskName, tags: task.tags.join(',') }),
        });
        this.props.modifyTask(taskName, newTaskName, task.tags);
      } catch (error) {
        console.error('Error modifying task name:', error);
      }
    }
  }

  async handleModifyTag(taskName) {
    const task = this.props.tasks[taskName];
    if (!task) {
      return;
    }
    const newTagsInput = prompt('Enter new tags (comma separated):', task.tags.join(', '));
    if (newTagsInput === null) {
      return;
    }
    const newTags = newTagsInput.split(',').map(tag => tag.trim());
    try {
      await fetch(`http://localhost:3010/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags: newTags.join(',') }),
      });
      this.props.modifyTask(taskName, task.name, newTags);
      newTags.forEach(tag => {
        const existingTag = this.props.tags.find(t => t.name === tag);
        if (!existingTag) {
          const highestTagId = this.props.tags.reduce((maxId, tag) => Math.max(maxId, tag.id), 0);
          this.props.addTag({ id: highestTagId + 1, name: tag });
        }
      });
    } catch (error) {
      console.error('Error modifying tags:', error);
    }
  }

  renderTaskTable() {
    return (
      <table className='styled-table'>
        <thead>
          <tr>
            <th>Task ID</th>
            <th>Task Name</th>
            <th>Tags</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(this.props.tasks).map((taskName) => {
            const task = this.props.tasks[taskName];
            return (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.name}</td>
                <td>{task.tags.join(', ')}</td>
                <td>
                  <button onClick={() => this.handleDeleteTask(taskName)}>Delete</button>
                  <button onClick={() => this.handleModifyName(taskName)}>Modify Name</button>
                  <button onClick={() => this.handleModifyTag(taskName)}>Modify Tags</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  renderTagTable() {
    return (
      <table className='styled-table'>
        <thead>
          <tr>
            <th>Tag ID</th>
            <th>Tag Name</th>
          </tr>
        </thead>
        <tbody>
          {this.props.tags.map((tag, index) => (
            <tr key={index}>
              <td>{tag.id}</td>
              <td>{tag.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  renderTaskForm() {
    return (
      <div className="task-form">
        <input
          type="text"
          placeholder="Task Name"
          value={this.state.taskName}
          onChange={(e) => this.setState({ taskName: e.target.value })}
        />
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={this.state.tags}
          onChange={(e) => this.setState({ tags: e.target.value })}
        />
        <button onClick={this.handleAddTask}>Add Task</button>
      </div>
    );
  }

  render() {
    return (
      <div>
        <h1>Task Editor</h1>
        <p>Adding and modifying tasks.</p>
        {this.renderTaskForm()}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          {this.renderTaskTable()}
          {this.renderTagTable()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  tasks: state.tasks,
  tags: state.tags,
  currentId: state.highestId,
});

const mapDispatchToProps = (dispatch) => ({
  initializeTags: (tags) => dispatch({ type: 'INITIALIZE_TAGS', payload: tags }),
  addTask: (id, name, tags) => dispatch({ type: 'ADD_TASK', payload: { id, name, tags } }),
  deleteTask: (name) => dispatch({ type: 'DELETE_TASK', payload: name }),
  modifyTask: (oldName, newName, tags) => dispatch({ type: 'MODIFY_TASK', payload: { oldName, newName, tags } }),
  addTag: (tag) => dispatch({ type: 'ADD_TAG', payload: tag }),
  modifyTag: (tag) => dispatch({ type: 'MODIFY_TAG', payload: tag }),
});

export default connect(mapStateToProps, mapDispatchToProps)(TaskEdit);
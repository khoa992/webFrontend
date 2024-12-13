import React from 'react';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import './App.css';
import TaskEdit from './TaskEdit';
import Chart from './Chart';
import About from './About';

class App extends React.Component {
  constructor(props) {
    super(props);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    this.state = {      
      selectedTask: [],
      startTime: {},
      isOngoing: {},
      taskTimes: {},
      selectedTags: [],
      timers: {},
      observationStart: this.formatLocalDateTime(startOfToday),
      observationEnd: this.formatLocalDateTime(now),
      taskDetailsStart: this.formatLocalDateTime(startOfToday),
      taskDetailsEnd: this.formatLocalDateTime(now),
      taskSummary: {},
      tagSummary: {},
    };
    this.handleStartStop = this.handleStartStop.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleTagSelection = this.handleTagSelection.bind(this);
    this.handleObservationStartChange = this.handleObservationStartChange.bind(this);
    this.handleObservationEndChange = this.handleObservationEndChange.bind(this);
    this.handleTaskDetailsStartChange = this.handleTaskDetailsStartChange.bind(this);
    this.handleTaskDetailsEndChange = this.handleTaskDetailsEndChange.bind(this);
  }

  componentDidMount() {
    this.fetchTasksAndTags();
    this.calculateSummary();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.isOngoing && !prevState.isOngoing) {
      this.startTimer(taskId);
    } else if (!this.state.isOngoing && prevState.isOngoing) {
      this.stopTimer(taskId);
    }

    if (this.state.observationStart !== prevState.observationStart || this.state.observationEnd !== prevState.observationEnd) {
      this.calculateSummary();
    }
  }

  componentWillUnmount() {
    this.stopTimer();
  }
  

  async fetchTasksAndTags() {
    try {
      const [tasksResponse, tagsResponse] = await Promise.all([
        fetch('http://localhost:3010/tasks'),
        fetch('http://localhost:3010/tags')
      ]);
      const tasks = await tasksResponse.json();
      const tags = await tagsResponse.json();

      const tagMap = {};
      tags.forEach(tag => {
        tagMap[tag.id] = tag.name;
      });

      const tasksWithTags = await Promise.all(tasks.map(async task => {
        const timestampsResponse = await fetch(`http://localhost:3010/timesfortask/${task.id}`);
        const timestamps = await timestampsResponse.json();
        return {
          ...task,
          tags: task.tags.split(',').map(tagId => tagMap[tagId]),
          timestamps
        };
      }));

      this.props.initializeTasks(tasksWithTags);
      this.calculateTaskHistory(tasksWithTags);

      const isOngoing = {};
      const startTimes = {};
      const taskTimes = {};

      tasksWithTags.forEach(task => {
        if (task.timestamps.length > 0) {
          const lastTimestamp = task.timestamps[task.timestamps.length - 1];
          if (lastTimestamp.type === 0) {
            const startTime = new Date(lastTimestamp.timestamp).getTime();
            isOngoing[task.id] = true;
            startTimes[task.id] = startTime;
            taskTimes[task.id] = Math.floor((Date.now() - startTime) / 1000);
          }
        }
      });


      this.setState((prevState) => ({
        isOngoing: { ...prevState.isOngoing, ...isOngoing },
        startTime: { ...prevState.startTime, ...startTimes },
        taskTimes: { ...prevState.taskTimes, ...taskTimes },
      }), () => {
        console.log('isOngoing:', this.state.isOngoing);
        console.log('startTimes:', this.state.startTime);
        console.log('taskTimes:', this.state.taskTimes);
      
        // Start the timer for ongoing tasks after state is set
        Object.keys(isOngoing).forEach(taskId => {
          if (isOngoing[taskId]) {
            this.startTimer(taskId);
          }
        });
      });

    } catch (error) {
      console.error('Error fetching tasks and tags:', error);
    }
  }

  async fetchTimestampsForTask(taskId) {
    try {
      const response = await fetch(`http://localhost:3010/timesfortask/${taskId}`);
      const timestamps = await response.json();
      return timestamps;
    } catch (error) {
      console.error(`Error fetching timestamps for task ${taskId}:`, error);
      return [];
    }
  }

  async calculateTaskHistory(tasks) {
    const taskHistory = [];

    for (const task of tasks) {
      const taskTimestamps = await this.fetchTimestampsForTask(task.id);
      for (let i = 0; i < taskTimestamps.length; i++) {
        const startTimestamp = taskTimestamps[i];
        if (startTimestamp.type === 0) {
          const stopTimestamp = taskTimestamps[i + 1];
          if (stopTimestamp && stopTimestamp.type === 1) {
            const duration = Math.round((new Date(stopTimestamp.timestamp) - new Date(startTimestamp.timestamp)) / 1000);
            taskHistory.push({
              taskId: task.id,
              taskName: task.name,
              tags: task.tags,
              duration,
              startTime: this.formatTimestamp(new Date(startTimestamp.timestamp)),
              stopTime: this.formatTimestamp(new Date(stopTimestamp.timestamp)),
            });
            i++; // Skip the next timestamp as it has been processed
          }
        }
      }
    }

    this.props.initializeTaskHistory(taskHistory);
  }

  formatTimestamp(date) {
    const pad = (num) => (num < 10 ? '0' + num : num);
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  formatElapsedTime(seconds) {
    const pad = (num) => (num < 10 ? '0' + num : num);
    const days = Math.floor(seconds / 86400);
    const hours = pad(Math.floor((seconds % 86400) / 3600));
    const minutes = pad(Math.floor((seconds % 3600) / 60));
    const secs = pad(seconds % 60);
    return `${days}d ${hours}:${minutes}:${secs}`;
  }

  formatLocalDateTime(date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  }

  startTimer(taskId) {
    const timer = setInterval(() => {
      this.setState((prevState) => ({
        taskTimes: {
          ...prevState.taskTimes,
          [taskId]: (prevState.taskTimes[taskId] || 0) + 1,
        },
      }));
    }, 1000);
  
    this.setState((prevState) => ({
      timers: {
        ...prevState.timers,
        [taskId]: timer,
      },
    }));
  }

  stopTimer(taskId) { 
    clearInterval(this.state.timers[taskId]);
    this.setState((prevState) => ({
      timers: {
        ...prevState.timers,
        [taskId]: null,
      },
    }));
  }

  async handleStartStop(taskId, taskName) {
    if (this.state.isOngoing[taskId]) {
      await this.stopTask(taskId, taskName);
    } else {
      this.startTask(taskId);
    }
  }

  startTask(taskId) {
    console.log(new Date().toISOString());
    this.setState((prevState) => ({
      startTime: { ...prevState.startTime, [taskId]: Date.now() },
      isOngoing: { ...prevState.isOngoing, [taskId]: true },
    }));
    this.startTimer(taskId);
  }

  async stopTask(taskId, taskName) {
    const task = this.props.tasks[taskName];
    // if (!task) {
    //   console.error(`Task with name ${taskId} not found.`);
    //   return;
    // }
  
    const startTime = this.state.startTime[taskId];
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
  
    this.setState((prevState) => {
      const updatedTaskTimes = { ...prevState.taskTimes };
      updatedTaskTimes[taskId] = (updatedTaskTimes[taskId] || 0);
  
      return {
        startTime: { ...prevState.startTime, [taskId]: startTime },
        isOngoing: { ...prevState.isOngoing, [taskId]: false },
        taskTimes: updatedTaskTimes,
      };
    });
  
    this.stopTimer(taskId);

  
    try {
      const formattedStartTime = this.formatTimestamp(new Date(startTime));
      const formattedEndTime = this.formatTimestamp(new Date(endTime));
  
      await fetch('http://localhost:3010/timestamps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timestamp: formattedStartTime, task: task.id, type: 0 }),
      });
      await fetch('http://localhost:3010/timestamps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timestamp: formattedEndTime, task: task.id, type: 1 }),
      });
  
      const newHistoryEntry = {
        taskId: task.id,
        taskName: task.name,
        tags: task.tags,
        duration,
        startTime: formattedStartTime,
        stopTime: formattedEndTime,
      };
      this.props.addTaskHistoryEntry(newHistoryEntry);
    } catch (error) {
      console.error('Error saving timestamps:', error);
    }
  }

  handleReset(taskId) {
    this.setState((prevState) => ({
      elapsedTimes: {
        ...prevState.elapsedTimes,
        [taskId]: 0,
      },
      taskTimes: {
        ...prevState.taskTimes,
        [taskId]: 0,
      },
    }));
  }

  handleTagSelection(event) {
    const selectedTags = Array.from(event.target.selectedOptions, option => option.value);
    this.setState((prevState) => ({
      selectedTags: [...new Set([...prevState.selectedTags, ...selectedTags])]
    }));
  }

  filterTasksByTags(tasks) {
    const { selectedTags } = this.state;
    if (selectedTags.length === 0) return tasks;
    return tasks.filter((task) =>
      selectedTags.every((tag) => task.tags.includes(tag))
    );
  }

  clearSelectedTags() {
    this.setState({ selectedTags: [] });
  }

  handleObservationStartChange(event) {
    this.setState({ observationStart: event.target.value });
  }

  handleObservationEndChange(event) {
    this.setState({ observationEnd: event.target.value });
  }

  handleTaskDetailsStartChange(event) {
    this.setState({ taskDetailsStart: event.target.value });
  }

  handleTaskDetailsEndChange(event) {
    this.setState({ taskDetailsEnd: event.target.value });
  }

  filterTaskHistory() {
    const { taskDetailsStart, taskDetailsEnd } = this.state;
    const start = new Date(taskDetailsStart).getTime();
    const end = new Date(taskDetailsEnd).getTime();
    return this.props.taskHistory
      .filter(entry => {
        const startTime = new Date(entry.startTime).getTime();
        const endTime = new Date(entry.stopTime).getTime();
        return (startTime >= start && startTime <= end) ||
              (endTime >= start && endTime <= end) ||
              (startTime <= start && endTime >= end);
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }

  calculateSummary() {
    const { observationStart, observationEnd } = this.state;
    const start = new Date(observationStart).getTime();
    const end = new Date(observationEnd).getTime();
    const filteredTaskHistory = this.props.taskHistory.filter(entry => {
      const startTime = new Date(entry.startTime).getTime();
      const endTime = new Date(entry.stopTime).getTime();
      return (startTime >= start && startTime <= end) ||
             (endTime >= start && endTime <= end) ||
             (startTime <= start && endTime >= end);
    });

    const taskSummary = {};
    const tagSummary = {};

    filteredTaskHistory.forEach(entry => {
      if (!taskSummary[entry.taskName]) {
        taskSummary[entry.taskName] = 0;
      }
      taskSummary[entry.taskName] += entry.duration;

      entry.tags.forEach(tag => {
        if (!tagSummary[tag]) {
          tagSummary[tag] = 0;
        }
        tagSummary[tag] += entry.duration;
      });
    });

    this.setState({ taskSummary, tagSummary });
  }

  renderSummary() {
    const { taskSummary, tagSummary } = this.state;

    return (
      <div className="summary">
        <h2>Summary</h2>
        <div className="summary-content">
          <div className="summary-section">
            <h3>Tasks of interest</h3>
            <ul>
              {Object.entries(taskSummary).map(([taskName, duration]) => (
                <li key={taskName}>
                  {taskName}: {this.formatElapsedTime(duration)}
                </li>
              ))}
            </ul>
          </div>
          <div className="summary-section">
            <h3>Tags of interest</h3>
            <ul>
              {Object.entries(tagSummary).map(([tag, duration]) => (
                <li key={tag}>
                  {tag}: {this.formatElapsedTime(duration)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  renderTagFilter() {
    const allTags = [...new Set(Object.values(this.props.tasks).flatMap(task => task.tags))];
    const isAnyTaskOngoing = Object.values(this.state.isOngoing).some(status => status);

    return (
      <div>
        <label htmlFor="tag-filter">Filter by tags:</label>
        <select
          id="tag-filter"
          multiple
          value={this.state.selectedTags}
          onChange={this.handleTagSelection}
          disabled={isAnyTaskOngoing}
        >
          {allTags.map((tag, index) => (
            <option key={index} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <button onClick={() => this.clearSelectedTags()}>Clear Selected Tags</button>
        <div>
          <strong>Selected Tags:</strong>
          {this.state.selectedTags.length > 0 ? (
            <ul>
              {this.state.selectedTags.map((tag, index) => (
                <li key={index}>{tag}</li>
              ))}
            </ul>
          ) : (
            <p>No tags selected</p>
          )}
        </div>
      </div>
    );
  }


  renderTimeDisplay() {
    const filteredTasks = this.filterTasksByTags(Object.values(this.props.tasks));
    return (
      <div className="time-display">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Task</th>
              <th>Tags</th>
              <th>Elapsed Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.name}</td>
                <td>{task.tags.join(', ')}</td>
                <td>{this.formatElapsedTime(this.state.taskTimes[task.id] || 0)}</td>
                <td className={this.state.isOngoing[task.id] ? 'status-active' : 'status-inactive'}>
                  {this.state.isOngoing[task.id] ? 'Active' : 'Inactive'}
                </td>
                <td>
                  <button onClick={() => this.handleStartStop(task.id, task.name)}>
                    {this.state.isOngoing[task.id] ? 'Stop' : 'Start'}
                  </button>
                  <button onClick={() => this.handleReset(task.id)}>Reset</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  renderTaskHistory() {
    const filteredTaskHistory = this.filterTaskHistory();
    return (
      <div className="task-history">
        <table className="history-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Task</th>
              <th>Tags</th>
              <th>Duration</th>
              <th>Start Time</th>
              <th>Stop Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredTaskHistory.map((entry, index) => (
              <tr key={index}>
                <td>{entry.taskId}</td>
                <td>{entry.taskName}</td>
                <td>{entry.tags.join(', ')}</td>
                <td>{this.formatElapsedTime(entry.duration)}</td>
                <td>{new Date(entry.startTime).toLocaleString()}</td>
                <td>{entry.stopTime ? new Date(entry.stopTime).toLocaleString() : 'Ongoing'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    return (
      <BrowserRouter>
        <div className="App">
          <nav className="navbar">
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/">Home</Link>
              </li>
              <li className="nav-item">
                <Link to="/TaskEdit">Task Editor</Link>
              </li>
              <li className="nav-item">
                <Link to="/Chart">Chart</Link>
              </li>
              <li className="nav-item">
                <Link to="/About">About</Link>
              </li>
            </ul>
          </nav>
          <Routes>
            <Route path="/TaskEdit" element={<TaskEdit />} />
            <Route path="/Chart" element={<Chart />} />
            <Route path="/About" element={<About />} />
            <Route
              path="/"
              element={
                <>
                  <h1>Task Tracker</h1>
                  {this.renderTagFilter()}
                  {this.renderTimeDisplay()}
                  <div className="observation-interval">
                    <label>Observation Start:</label>
                    <input
                      type="datetime-local"
                      value={this.state.observationStart}
                      onChange={this.handleObservationStartChange}
                    />
                    <label>Observation End:</label>
                    <input
                      type="datetime-local"
                      value={this.state.observationEnd}
                      onChange={this.handleObservationEndChange}
                    />
                  </div>                  
                  {this.renderSummary()}

                  <div className="task-details-interval">
                    <label>Task Details Start:</label>
                    <input
                      type="datetime-local"
                      value={this.state.taskDetailsStart}
                      onChange={this.handleTaskDetailsStartChange}
                    />
                    <label>Task Details End:</label>
                    <input
                      type="datetime-local"
                      value={this.state.taskDetailsEnd}
                      onChange={this.handleTaskDetailsEndChange}
                    />
                  </div>
                  {this.renderTaskHistory()}
                </>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    );
  }
}

const mapStateToProps = (state) => ({
  tasks: state.tasks,
  taskHistory: state.taskHistory,
});

const mapDispatchToProps = (dispatch) => ({
  initializeTasks: (tasks) => dispatch({ type: 'INITIALIZE_TASKS', payload: tasks }),
  initializeTaskHistory: (taskHistory) => dispatch({ type: 'INITIALIZE_TASK_HISTORY', payload: taskHistory }),
  addTaskHistoryEntry: (entry) => dispatch({ type: 'ADD_TASK_HISTORY_ENTRY', payload: entry }),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
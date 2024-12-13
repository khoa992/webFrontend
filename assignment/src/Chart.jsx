import React, { useState } from 'react';
import { connect } from 'react-redux';
import './Chart.css';

function Chart({ tasks, taskHistory }) {
  const [selectedTask, setSelectedTask] = useState('');
  const [chartStart, setChartStart] = useState('');
  const [chartEnd, setChartEnd] = useState('');

  const handleTaskChange = (event) => {
    setSelectedTask(event.target.value);
  };

  const handleChartStartChange = (event) => {
    setChartStart(event.target.value);
  };

  const handleChartEndChange = (event) => {
    setChartEnd(event.target.value);
  };

  const getDailyActiveTimes = () => {
    if (!selectedTask || !chartStart || !chartEnd) return [];

    const start = new Date(chartStart).getTime();
    const end = new Date(chartEnd).getTime();
    const dailyActiveTimes = {};

    taskHistory.forEach(entry => {
      if (entry.taskName === selectedTask) {
        const entryStart = new Date(entry.startTime).getTime();
        const entryEnd = new Date(entry.stopTime).getTime();

        for (let day = start; day <= end; day += 86400000) {
          const dayStart = day;
          const dayEnd = day + 86400000 - 1;

          if ((entryStart >= dayStart && entryStart <= dayEnd) ||
              (entryEnd >= dayStart && entryEnd <= dayEnd) ||
              (entryStart <= dayStart && entryEnd >= dayEnd)) {
            const overlapStart = Math.max(entryStart, dayStart);
            const overlapEnd = Math.min(entryEnd, dayEnd);
            const duration = (overlapEnd - overlapStart) / (1000 * 60 * 60); // Convert to hours

            const dayKey = new Date(dayStart).toISOString().slice(0, 10);
            if (!dailyActiveTimes[dayKey]) {
              dailyActiveTimes[dayKey] = 0;
            }
            dailyActiveTimes[dayKey] += duration;
          }
        }
      }
    });

    return Object.entries(dailyActiveTimes).map(([day, duration]) => ({
      day,
      duration,
    }));
  };

  const groupConsecutiveDays = (dailyActiveTimes) => {
    const groupedTimes = [];
    let currentGroup = null;

    dailyActiveTimes.forEach(({ day, duration }) => {
      if (currentGroup && currentGroup.duration === duration) {
        currentGroup.days.push(day);
      } else {
        if (currentGroup) {
          groupedTimes.push(currentGroup);
        }
        currentGroup = { days: [day], duration };
      }
    });

    if (currentGroup) {
      groupedTimes.push(currentGroup);
    }

    return groupedTimes;
  };

  const formatDateRange = (days) => {
    const formatDate = (date) => date.slice(5);
    if (days.length === 1) {
      return formatDate(days[0]);
    }
    return `${formatDate(days[0])}->${formatDate(days[days.length - 1])}`;
  };

  const dailyActiveTimes = getDailyActiveTimes();
  const groupedTimes = groupConsecutiveDays(dailyActiveTimes);

  return (
    <div>
      <h1>Chart</h1>
      <p>This is the second additional view.</p>
      <div className="task-selection">
        <label>Select Task:</label>
        <select value={selectedTask} onChange={handleTaskChange}>
          <option value="">Select a task</option>
          {Object.values(tasks).map(task => (
            <option key={task.id} value={task.name}>
              {task.name}
            </option>
          ))}
        </select>
      </div>
      <div className="chart-interval">
        <label>Chart Start:</label>
        <input type="date" value={chartStart} onChange={handleChartStartChange} />
        <label>Chart End:</label>
        <input type="date" value={chartEnd} onChange={handleChartEndChange} />
      </div>
      <div className='bar-chart-container'>
        <div className="bar-chart">
          {groupedTimes.map(({ days, duration }, index) => (
            <div key={days.join('-')} className="bar" style={{ width: `15%` }}>
              <div className="bar-value" style={{ height: `${(duration / 24) * 200}px` }}>
                {Math.round(duration * 100) / 100} hrs
              </div>
              <div className="bar-label">{formatDateRange(days)}</div>
            </div>
          ))}
        </div>
      </div>      
    </div>
  );
}

const mapStateToProps = (state) => ({
  tasks: state.tasks,
  taskHistory: state.taskHistory,
});

export default connect(mapStateToProps)(Chart);
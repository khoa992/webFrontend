import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about">
      <h1>About This Application</h1>
      <h3 className='author'>Author</h3>
      <p className="author">Nguyen Minh Khang</p>
      
      <h2 className="text">Instructions</h2>
      <p className="text">
        The home page is where most of the features are. From the top down, there's a tag filter, an activity and time table, an observation summary, and a interval table. 
        The tag filter allows you to filter the tasks by tags, there's a button to reset the filter.
        The activity and time table shows the activity of each task and the time spent on them, there are also button that allows user to activate, stop or reset the timer.
        The observation summary shows the total time spent on each tasks within the selected interval.
        The interval table shows the duration, start date and end date of an active period. Users can use the active interval to filter tasks period.

        The task editor page allows users to add, delete, modify tasks and tags.

        The chart page shows the active time of a selected task in a selected interval every day in a bar chart.
      </p>

      <h2 className="text">Content and Licenses</h2>
      <p className="text">No external content are used in this application.</p>
      
      <h2 className="text">AI Tools</h2>
      <p className="text">AI tool used is ChatGPT for some functionalities.</p>
      
      <h2 className="text">Working Hours</h2>
      <p className="text">Approximately 120 hours were spent working on this programming assignment.</p>
      
      <h2 className="text">Most Difficult Feature</h2>
      <p className="text">The most difficult and tedious features are making the timer already running because some tasks is active from the start, and getting the time to be correct. </p>
    </div>
  );
};

export default About;
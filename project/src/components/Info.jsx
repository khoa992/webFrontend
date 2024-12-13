// src/components/Info.jsx
import React from "react";

const Info = () => {
  return (
    <div>
      <h2>About This App</h2>
      <p>
        <strong>Author:</strong> Your Name
      </p>
      <p>
        <strong>Instructions:</strong> Using this application should be
        intuitive and straightforward. The UI hints help the user figure out how
        to add recipes, view them, and access their details.
      </p>
      <p>
        <strong>Content Creation:</strong> All content (text and images) in this
        application is originally created.
      </p>
      <p>
        <strong>AI Tools:</strong> AI tools were used to assist in generating
        ideas and code structure. However, all code was written by the author.
      </p>
      <p>
        <strong>Work Hours:</strong> Approximately 20 hours were spent working
        on this assignment.
      </p>
      <p>
        <strong>Most Difficult Feature:</strong> The most tedious feature was
        implementing the dynamic handling of tags and ensuring data consistency
        across components.
      </p>
    </div>
  );
};

export default Info;

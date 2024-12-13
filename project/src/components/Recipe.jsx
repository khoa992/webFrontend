// src/components/Recipe.jsx
import React from "react";
import { Link } from "react-router-dom";
import Tag from "./Tag";

const Recipe = ({ recipe }) => {
  return (
    <div className="recipe">
      <h3>{recipe.name}</h3>
      <div className="tags">
        {recipe.tags.map((tag, index) => (
          <Tag key={index} name={tag} />
        ))}
      </div>
      <Link to={`/recipe/${recipe.id}`} className="view-details">
        View Details
      </Link>
    </div>
  );
};

export default Recipe;

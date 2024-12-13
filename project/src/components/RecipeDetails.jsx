// src/components/RecipeDetails.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";

const RecipeDetails = ({ recipes }) => {
  const { id } = useParams();
  const navigate = useNavigate(); // Initialize navigate function
  const recipe = recipes.find((recipe) => recipe.id === parseInt(id));

  if (!recipe) return <p>Recipe not found</p>;

  return (
    <div className="recipe-details">
      <h2>{recipe.name}</h2>
      <h3>Ingredients</h3>
      <ul>
        {recipe.ingredients.map((ingredient, index) => (
          <li key={index}>{ingredient}</li>
        ))}
      </ul>
      <h3>Instructions</h3>
      <p>{recipe.instructions}</p>
      <button onClick={() => navigate("/")}>Back to Recipe List</button>
    </div>
  );
};

export default RecipeDetails;

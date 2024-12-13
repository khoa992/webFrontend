import { createStore } from 'redux';

const initialState = {
  tasks: {},
  tags: [],
  timestamps: [],
  taskHistory: [],
  currentId: 0,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'INITIALIZE_TASKS':
      const tasks = {};
      let highestId = 0;
      action.payload.forEach(task => {
        tasks[task.name] = { id: task.id, name: task.name, tags: task.tags };
        if (task.id > highestId) {
          highestId = task.id;
        }
      });
      return {
        ...state,
        tasks,
        highestId,
      };

    case 'INITIALIZE_TAGS':
      return {
        ...state,
        tags: action.payload,
      };

    case 'INITIALIZE_TIMESTAMPS':
      return {
        ...state,
        timestamps: action.payload,
      };

    case 'INITIALIZE_TASK_HISTORY':
      return {
        ...state,
        taskHistory: action.payload,
      };

    case 'ADD_TASK_HISTORY_ENTRY':
      return {
        ...state,
        taskHistory: [...state.taskHistory, action.payload],
      };

    case 'ADD_TASK':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.name]: { id: action.payload.id, name: action.payload.name, tags: action.payload.tags },
        },
      };

    case 'DELETE_TASK':
      const { [action.payload]: deletedTask, ...remainingTasks } = state.tasks;
      return {
        ...state,
        tasks: remainingTasks,
      };

    case 'MODIFY_TASK':
      const { oldName, newName, tags } = action.payload;
      const { [oldName]: modifiedTask, ...restTasks } = state.tasks;
      return {
        ...state,
        tasks: {
          ...restTasks,
          [newName]: { id: modifiedTask.id, name: newName, tags },
        },
      };

    case 'ADD_TAG':
      return {
        ...state,
        tags: [...state.tags, action.payload],
      };

    case 'MODIFY_TAG':
      return {
        ...state,
        tags: state.tags.map(tag =>
          tag.id === action.payload.id ? { ...tag, name: action.payload.name } : tag
        ),
      };

    default:
      return state;
  }
};

// Create store
const store = createStore(reducer);

export default store;
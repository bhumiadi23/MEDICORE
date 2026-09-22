import React, { createContext, useContext, useReducer, useCallback } from 'react';
const generateId = () => Math.random().toString(36).substring(2, 9);
const NotificationContext = createContext();


const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return [action.payload, ...state];
    case 'REMOVE_NOTIFICATION':
      return state.filter(n => n.id !== action.payload);
    case 'CLEAR_ALL':
      return [];
    case 'MARK_AS_READ':
      return state.map(n => n.id === action.payload ? { ...n, read: true } : n);
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, dispatch] = useReducer(notificationReducer, []);

  const addNotification = useCallback((notification) => {
    const id = generateId();
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { ...notification, id, timestamp: Date.now(), read: false }
    });
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const markAsRead = useCallback((id) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll,
      markAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

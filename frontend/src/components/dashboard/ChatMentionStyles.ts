export default {
    control: {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      fontSize: 14,
      fontWeight: 'normal',
      borderRadius: '8px',
      padding: '8px 16px',
      width: '100%',
      border: '1px solid transparent',
      transition: 'border-color .2s ease-in-out',
      outline: 'none',
    },
  
    '&multiLine': {
      control: {
        fontFamily: 'sans-serif',
        minHeight: 40,
        outline: 'none',
      },
      highlighter: {
        padding: '8px 16px',
        border: '1px solid transparent',
        outline: 'none',
      },
      input: {
        padding: '8px 16px',
        outline: 'none',
      },
    },
  
    suggestions: {
      list: {
        backgroundColor: '#1E293B', // slate-800
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: 14,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        maxHeight: '200px',
        overflowY: 'auto',
      },
      item: {
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        '&focused': {
          backgroundColor: '#ff69b4', // neon-pink
          color: '#0A101E', // dark-blue
        },
      },
    },
  } 
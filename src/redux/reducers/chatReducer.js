const initialState = {
    chats: [],
    loading: false,
    error: null,
  };
  
  const chatReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'FETCH_CHATS_REQUEST':
        return { ...state, loading: true };
      case 'FETCH_CHATS_SUCCESS':
        return { ...state, loading: false, chats: action.payload };
      case 'FETCH_CHATS_FAILURE':
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };
  
  export default chatReducer;
  
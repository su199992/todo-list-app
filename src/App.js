import './App.css';
import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import IconButton from '@mui/material/IconButton'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Checkbox from '@mui/material/Checkbox'
import Delete from '@mui/icons-material/Delete'

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, doc, setDoc, getDocs, deleteDoc, query, orderBy, where } from "firebase/firestore";
import { GoogleAuthProvider, getAuth, signInWithRedirect, onAuthStateChanged, signOut } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBaE_YedYI2mnivpRMk961KLpzT77sPdvM",
  authDomain: "todo-list-app-ec64b.firebaseapp.com",
  projectId: "todo-list-app-ec64b",
  storageBucket: "todo-list-app-ec64b.appspot.com",
  messagingSenderId: "382951506379",
  appId: "1:382951506379:web:978efdbda3792c0699b64e",
  measurementId: "G-376X0892G3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();
const auth = getAuth(app);

const TodoItemInputField = (props) => {
  const [input, setInput] = useState("");
  const onSubmit = () => {
    props.onSubmit(input);
    setInput("");
  };

  return (
    <Box sx={{margin: "auto"}}>
      <Stack direction="row" spacing={2} justifyContent="center">
        <TextField
          id='todo-item-input'
          label='Todo Item'
          variant='outlined'
          onChange={(e) => setInput(e.target.value)} value={input}
        />
        <Button variant='outlined' onClick={onSubmit}>Submit</Button>  
      </Stack>
    </Box>
);
};

const TodoItem = (props) => {
  const style = props.todoItem.isFinished ? { textDecoration: 'line-through'} : {} ;
  return (
    <li>
      <span
      style={style}
      onClick={() => props.onTodoItemClick(props.todoItem)}>
      {props.todoItem.todoItemContent}</span>
      <Button variant='outlined' onClick={() => props.onRemoveClick(props.todoItem)}>Remove</Button>
    </li>
  );
};

const TodoItemList = (props) => {
  const todoList = props.todoItemList.map((todoItem, index) => {
    return <TodoItem 
      key={todoItem.id} 
      todoItem={todoItem} 
      onTodoItemClick={props.onTodoItemClick}
      onRemoveClick={props.onRemoveClick}
    />;
  });
  return (
    <Box>
      <List sx={{ margin: "auto", maxWidth: 720}}>
        {todoList}
      </List>
    </Box>
  );
};

const TodoListAppBar = (props) => {
  const loginWithGoogleButton = (
    <Button color='inherit' onClick={() => {
      signInWithRedirect(auth, provider);
    }}> 
      Login with Google
    </Button>
  );
  const logoutButton = (
    <Button color='inherit' onClick={() => {
      signOut(auth);
    }}> 
      Log out
    </Button>
  );

  const button = props.currentUser === null ? loginWithGoogleButton : logoutButton;

  return (
    <AppBar position='static'>
      <Toolbar sx={{ width: "100%", maxWidth: 720, margin: "auto"}}>
        <Typography variant='h6' component="div">
          Todo List App
        </Typography>
        <Box sx={{flexGrow: 1}} />
        {button}
      </Toolbar>
    </AppBar>
  );
};

function App() {
  const [todoItemList, setTodoItemList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setCurrentUser(user.uid);
    } else {
      setCurrentUser(null);
    }
  });

  const syncTodoItemListStateWithFirestore = () => {
    const q = query(collection(db, "todoItem"), where("userId", "==", currentUser), orderBy("createdTime", "desc"));
    getDocs(q).then((querySnapshot) => {
      const firestoreTodoItemList = [];
      querySnapshot.forEach((doc) => {
        firestoreTodoItemList.push({
          id : doc.id,
          todoItemContent : doc.data().todoItemContent,
          isFinished : doc.data().isFinished,
          createdTime : doc.data().createdTime ?? 0,
          userId : doc.data().userId,
        });
      });
      setTodoItemList(firestoreTodoItemList);
    })
  };

  useEffect(() => {
    const syncTodoItemListStateWithFirestore = () => {
      // Function implementation here
    };

    syncTodoItemListStateWithFirestore();
  }, [currentUser]); // Dependencies that cause this effect to re-run
  

  const onSubmit = async (newTodoItem) => {
    await addDoc(collection(db, "todoItem"), {
      todoItemContent : newTodoItem,
      isFinished : false,
      createdTime : Math.floor(Date.now() / 1000),
      userId : currentUser,
    });

    syncTodoItemListStateWithFirestore();
  };

  const onTodoItemClick = async (clickedTodoItem) => {
    const todoItemRef = doc(db, "todoItem", clickedTodoItem.id);
    await setDoc(todoItemRef, { isFinished : !clickedTodoItem.isFinished }, { merge : true });
    syncTodoItemListStateWithFirestore();
  };

  const onRemoveClick = async(removedTodoItem) => {
    const todoItemRef = doc(db, "todoItem", removedTodoItem.id);
    await deleteDoc(todoItemRef);
    syncTodoItemListStateWithFirestore();
  };

  return (
    <div className="App">
      <TodoListAppBar currentUser={currentUser} />
      <Container sx={{ paddingTop : 3}}>
      <TodoItemInputField onSubmit={onSubmit}/>
      <TodoItemList 
        todoItemList={todoItemList} 
        onTodoItemClick={onTodoItemClick}
        onRemoveClick={onRemoveClick}
      />
      </Container>
    </div>
  );
}

export default App;

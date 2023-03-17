import React, { useEffect, useRef, useState } from 'react'
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import { useLocation,useNavigate ,Navigate , useParams} from 'react-router-dom';
import { toast } from 'react-hot-toast';

import axios from 'axios'

const EditorPage = () => {

    const socketRef=useRef(null);
    const codeRef=useRef(null);
    const location=useLocation();
    const [fontSize, setFontSize] = useState(20);
    const {roomId}=useParams();
    // console.log(roomId); 
    const reactNavigator=useNavigate();

    const[clients,setClients]=useState([]);

    useEffect(()=>{
      const init =async()=>{
        socketRef.current= await initSocket();

        socketRef.current.on('connect_error', (err) => handleErrors(err));

         socketRef.current.on('connect_failed', (err) => handleErrors(err));

         function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }
          
        socketRef.current.emit(ACTIONS.JOIN,{
          roomId,
          username:location.state?.username,
        });

        //Listening for joined event 
        socketRef.current.on(
          ACTIONS.JOINED,
          ({clients,username,socketId})=>{
             if(username!==location.state?.username){
               toast.success(`${username} joined the room.`);
               console.log(`${username} joined`)
             }
             setClients(clients);
             //here we code sync 
             socketRef.current.emit(ACTIONS.SYNC_CODE,{
              code:codeRef.current,
              socketId,
             });
          }
        );

        //Listening for disconnected 
        socketRef.current.on(ACTIONS.DISCONNECTED,({socketId,username})=>{
          toast.success(`${username} left the room.`);
          setClients((prev)=>{
            return prev.filter(
              client=>client.socketId!=socketId
              );
          })
        })

      };
      init();
      return ()=>{
        socketRef.current.off(ACTIONS.JOINED); 
        socketRef.current.off(ACTIONS.DISCONNECTED); 
        socketRef.current.disconnect(); 
      }
    },[]);
    

       if(!location.state){
        return <Navigate to="/"/>;
       }


// button copy room id function
 async function copyRoomid(){
   try{
    await navigator.clipboard.writeText(roomId);
    toast.success('Room ID Copied to clipboard successfully! ', {
      id: 'clipboard',
    });
   } 
   catch(err){
    toast.error('could not copied room id');
    console.error(err);
   }
 }

 // button leave room function
  
  function leaveRoom(){
    reactNavigator('/');
  }
  // compiler code for our user program
  const runCode = () => {
    const lang = document.getElementById("languageOptions").value;
    const input = document.getElementById("input").value;
    const code = codeRef.current;
   
   toast.loading("Running Code....",
   {
    id: 'runload',
    duration: 10000,  
   });
   
    const encodedParams = new URLSearchParams();
    encodedParams.append("LanguageChoice", lang);
    encodedParams.append("Program", code);
    encodedParams.append("Input", input);
    
    // const API_KEY = process.env.REACT_APP_SOME_VARIABLE;
    // console.log(API_KEY)
    const key='2e9f35b44amshe6c668e93b8841cp179bafjsn0d2082855ac0';
    const options = {
      method: 'POST',
      url: 'https://code-compiler.p.rapidapi.com/v2',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-RapidAPI-Key': '2e9f35b44amshe6c668e93b8841cp179bafjsn0d2082855ac0',
        // 'X-RapidAPI-Key': process.env.REACT_APP_SOME_VARIABLE,
        'X-RapidAPI-Host': 'code-compiler.p.rapidapi.com'
      },
      data: encodedParams
    };
    // console.log(options);  
   axios.request(options)
      .then(function (response) {
        let message = response.data.Result;
        if (message === null) {
          message = response.data.Errors;
        }
       document.getElementById("output").value = message;
        toast.dismiss();
        toast.success("Code compilation complete");
      })
      .catch(function (error) {
        toast.dismiss();
        toast.error("Code compilation unsuccessful");
        document.getElementById("output").value =
          "Something went wrong, Please check your code and input.";
      });
  };

  return (
    <div className='mainWrap'>
     <div className='leftSide'>
        <div className='leftSideInner'>
            <div className='logo'>
            <img src='/websitelogo.png'height='60px' width='200px' alt='logo of our website'/>
            </div>
            <h3>Connected</h3>
            <div className='clientLists'>
                {clients.map(client=>(<Client 
                key={client.socketId}
                username={client.username}/>))}
            </div>
        </div>
        
        
        <button className='btn coptBtn ' onClick={copyRoomid}>Copy Room ID</button>
        <button className='btn leaveBtn' onClick={leaveRoom}>Leave</button>
     </div>
     <div className='editorWrap'  >
        <Editor  socketRef={socketRef} roomId={roomId} onCodeChange={(code)=>{codeRef.current=code;}} />
     </div>
       <div className='ioWrap'>
       <label>
          <span className='languageText'> Language</span>
          <select id="languageOptions" className="selectLang" defaultValue="7">
            <option value="6">C </option>
            <option value="7">C++</option>
            <option value="4">Java</option>
             <option value="17">Javascript</option>
            <option value="5">Python</option>
           </select>
        </label>
        INPUT 
        <textarea
          id="input"
          className="inputArea io-style"
          placeholder="Enter input here"
        ></textarea>
        OUTPUT  
        <textarea  
        id="output" 
         className="outputArea io-style "
          placeholder="Output Shows here"></textarea>
          <button className="btn runBtn"  onClick={runCode} >  Run Code </button>
          </div>
          
    </div>
  )
}

export default EditorPage

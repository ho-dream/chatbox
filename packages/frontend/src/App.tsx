import { useState } from 'react';
import reactLogo from './assets/react.svg';
import ViteLogo from './assets/vite.svg';
import TauriLogo from './assets/tauri.svg';
import './App.css';

function App() {
  const [greetMsg, setGreetMsg] = useState('');
  const [name, setName] = useState('');

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    const response = await fetch(`http://localhost:3030/hello?name=${name}`);
    const data = await response.json();
    setGreetMsg(data.message);
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src={ViteLogo} className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank" rel="noreferrer">
          <img src={TauriLogo} className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;

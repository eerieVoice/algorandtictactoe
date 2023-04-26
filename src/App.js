import React, { useState, useEffect } from 'react';
import './App.css';
import './components/styles/ConnectWallet.css';
import { Board } from './components/Board/Board';
import { ScoreBoard } from './components/Board/ScoreBoard';
import { ResetButton } from './components/ResetButton';
// import { ConnectWallet } from './components/ConnectWallet'; // this is a component not a pera wallet
import { Logo } from './components/Logo';
import algosdk, { waitForConfirmation } from 'algosdk';
import { PeraWalletConnect } from '@perawallet/connect';
const peraWallet = new PeraWalletConnect();

const appIndex = 205332818;

const algod = new algosdk.Algodv2(
  '',
  'https://testnet-api.algonode.cloud',
  443
);
function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xPlaying, setXPlaying] = useState(true);
  // const [scores, setScores] = useState({ xScore: 0, oScore: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  // const [localCount, setLocalCount] = useState(null);
  const [accountAddress, setAccountAddress] = useState(null);
  const isConnectedToPeraWallet = !!accountAddress;

  useEffect(() => {
    // Reconnect to the session when the component is mounted
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        peraWallet.connector.on('disconnect', handleDisconnectWalletClick);

        if (accounts.length) {
          setAccountAddress(accounts[0]);
        }
      })
      .catch((e) => console.log(e));
  }, []);

  function handleConnectWalletClick() {
    peraWallet
      .connect()
      .then((newAccounts) => {
        peraWallet.connector.on('disconnect', handleDisconnectWalletClick);

        setAccountAddress(newAccounts[0]);
      })
      .catch((error) => {
        if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
          console.log(error);
        }
      });
  }

  function handleDisconnectWalletClick() {
    peraWallet.disconnect();

    setAccountAddress(null);
  }

  const winConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const handleBoxClick = (boxIdx) => {
    const updatedBoard = board.map((value, idx) => {
      if (idx === boxIdx) {
        return xPlaying === true ? 'X' : 'O';
      } else {
        return value;
      }
    });
    const winner = checkWinner(updatedBoard);
    if (winner) {
      if (winner === 'O') {
        // setCount2((prevCount2) => prevCount2 + 1);
        increaseScore('scorePlayer1');
      }
      if (winner === 'X') {
        // setCount1((prevCount1) => prevCount1 + 1);
        increaseScore('scorePlayer2');
      }
      console.log(`The is winner is ${winner}`);
    }

    // if (winner) {
    //   if (winner === 'O') {
    //     let { oScore } = scores;
    //     oScore += 1;
    //     setScores({ ...scores, oScore });
    //   } else {
    //     let { xScore } = scores;
    //     xScore += 1;
    //     setScores({ ...scores, xScore });
    //   }
    // }

    setBoard(updatedBoard);
    setXPlaying(!xPlaying);
  };

  const checkWinner = (board) => {
    for (let i = 0; i < winConditions.length; i++) {
      const [x, y, z] = winConditions[i];

      if (board[x] && board[x] === board[y] && board[y] === board[z]) {
        setGameOver(true);
        return board[x];
      }
    }
  };

  const resetBoard = () => {
    setGameOver(false);
    setBoard(Array(9).fill(null));
  };

  return (
    <div className='App'>
      <Logo />
      {isConnectedToPeraWallet && (
        <ScoreBoard count1={count1} count2={count2} xPlaying={xPlaying} />
      )}
      <button className='btn-wallet' onClick={() => optInToApp()}>
        Opt-in
      </button>

      <button
        className='connect-btn'
        onClick={
          isConnectedToPeraWallet
            ? handleDisconnectWalletClick
            : handleConnectWalletClick
        }
      >
        {isConnectedToPeraWallet ? 'Disconnect' : 'Connect to Pera Wallet'}
      </button>
      {isConnectedToPeraWallet && (
        <>
          <Board
            board={board}
            onClick={gameOver ? resetBoard : handleBoxClick}
          />
          <ResetButton resetBoard={resetBoard} />
        </>
      )}
    </div>
  );
  async function checkScoreX() {
    try {
      const accountInfo = await algod
        .accountApplicationInformation(accountAddress, appIndex)
        .do();
      if (!!accountInfo['app-local-state']['key-value'][0].value.uint) {
        setCount1(accountInfo['app-local-state']['key-value'][0].value.uint);
      } else {
        setCount1(0);
      }
      console.log(
        `Check score X: ${accountInfo['app-local-state']['key-value'][0].value.uint}`
      );
    } catch (e) {
      console.error('There was an error connecting to the algorand node: ', e);
    }
  }
  async function checkScoreO() {
    try {
      const accountInfo = await algod
        .accountApplicationInformation(accountAddress, appIndex)
        .do();
      if (!!accountInfo['app-local-state']['key-value'][1].value.uint) {
        setCount2(accountInfo['app-local-state']['key-value'][1].value.uint);
      } else {
        setCount2(0);
      }
      console.log(
        `Check score O: ${accountInfo['app-local-state']['key-value'][1].value.uint}`
      );
    } catch (e) {
      console.error('There was an error connecting to the algorand node: ', e);
    }
  }
  async function increaseScore(action) {
    try {
      // get suggested params
      const suggestedParams = await algod.getTransactionParams().do();
      const appArgs = [new Uint8Array(Buffer.from(action))];

      const actionTx = algosdk.makeApplicationNoOpTxn(
        accountAddress,
        suggestedParams,
        appIndex,
        appArgs
      );

      const actionTxGroup = [{ txn: actionTx, signers: [accountAddress] }];

      const signedTx = await peraWallet.signTransaction([actionTxGroup]);
      console.log(signedTx);
      const { txId } = await algod.sendRawTransaction(signedTx).do();
      await waitForConfirmation(algod, txId, 2);
      checkScoreX();
      checkScoreO();
    } catch (e) {
      console.error(`There was an error calling the app: ${e}`);
    }
  }
  async function optInToApp() {
    const suggestedParams = await algod.getTransactionParams().do();
    const optInTxn = algosdk.makeApplicationOptInTxn(
      accountAddress,
      suggestedParams,
      appIndex
    );

    const optInTxGroup = [{ txn: optInTxn, signers: [accountAddress] }];

    const signedTx = await peraWallet.signTransaction([optInTxGroup]);
    console.log(signedTx);
    const { txId } = await algod.sendRawTransaction(signedTx).do();
    await waitForConfirmation(algod, txId, 2);
  }
}
export default App;

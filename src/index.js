import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

import { db } from "./firebase-config";
import { get, onValue, set, child, ref } from 'firebase/database'

import "./styles/index.css";

const makeCode = length => {
    var result = '';
    var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;

    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() *charactersLength));
   }

   return result;
}

const generatedCode = makeCode(5);
const defIndexes = [
    "none", "none", "none",
    "none", "none", "none",
    "none", "none", "none",
];

const App = () => {
    const [code, setCode] = useState("");
    const [started, setStarted] = useState(false);
    const [token, setToken] = useState("none");
    const [gridData, setGridData] = useState(defIndexes);

    const disableButtons = () => {
        document.querySelectorAll("#grid button").forEach(button => {
            button.disabled = true;
            button.style.cursor = "not-allowed";
        });
    }

    const enableButtons = () => {
        document.querySelectorAll("#grid button").forEach(button => {
            button.disabled = false;
            button.style.cursor = "pointer";
        });
    }

    const showLine = (angle, top, left) => {
        const lineStyle = document.getElementById("line").style;
        lineStyle.marginTop = `${((top - 3) * 86.6)}px`;
        lineStyle.marginLeft = `${((left - 1) * 255) + 3.5}px`;

        if(top === -2 && left === -2) {
            lineStyle.marginTop = "0"
            lineStyle.marginLeft = "0"
            lineStyle.width = "400px"
        }

        lineStyle.transform = `rotate(${angle}deg)`;
        lineStyle.display = "block";
    }

    const checkForWinner = data => {
        if(data[4] !== "none") {
            if(data[0] === data[4] && data[4] === data[8]) {
                disableButtons();
                showLine(45, -2, -2);
                return
            }

            if(data[2] === data[4] && data[4] === data[6]) {
                disableButtons();
                showLine(-45, -2, -2);
                return
            }
        }

        for(let i = 0; i < 3; i++) {
            if(data[i] !== "none" && data[i] === data[i + 3] && data[i + 3] == data[i + 6]) {
                disableButtons();
                showLine(90, 3, i);
                return
            }
        }

        for(let i = 0; i < 7; i += 3) {
            if(data[i] !== "none" && data[i] === data[i + 1] && data[i + 1] == data[i + 2]) {
                disableButtons();
                showLine(0, i, 1);
                return
            }
        }
    }

    const handleSubmit = e => {
        e.preventDefault();

        if(code.length < 5) {
            return
        }

        if(code === generatedCode) {
            return
        }

        get(
            child(ref(db), `/${code}`)
        ).then(snapshot => {
            if(snapshot.val() === null) {
                return
            }

            if(snapshot.val().state !== "unin") {
                alert("Game already started !");
                return
            }

            set(
                ref(db, `/${code}`),
                {
                    state: "x-playing",
                    grid: snapshot.val().grid
                }
            )

            document.getElementById("grid").style.display = "flex";
            document.getElementById("formWrapper").style.display = "none";
        })

        setToken("o");
        disableButtons();
        setStarted(true);
    }

    const handleClick = index => {
        if(gridData[index] !== "none") return

        let localGrid = gridData;
        localGrid[index] = token;

        disableButtons();
        
        set(
            ref(db, `/${code}`),
            {
                state: `${(token === "o") ? "x" : "o"}-playing`,
                grid: localGrid
            }
        )
    }

    const copyToClipboard = () => {
        document.querySelector('#codeWrapper input').focus()
        document.querySelector('#codeWrapper input').select()

        try {
            document.execCommand('copy')
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        onValue(
            ref(db, `/${generatedCode}/state`),
            snapshot => {
                if(snapshot.val() !== "unin") {
                    document.getElementById("formWrapper").style.display = "none";
                    document.getElementById("grid").style.display = "flex";
                    document.getElementById("codeWrapper").style.display = "none";

                    setToken("x");
                    setCode(generatedCode);
                    setStarted(true);
                }
            }
        )

        set(
            ref(db, `/${generatedCode}`),
            {
                state: "unin",
                grid: defIndexes
            }
        )
    }, [])

    useEffect(() => {
        if(!started) return

        onValue(
            ref(db, `/${code}/state`),
            snapshot => {
                if(snapshot.val()[0] === token) {
                    enableButtons();
                }
            }
        )

        onValue(
            ref(db, `/${code}/grid`),
            snapshot => {
                setGridData(snapshot.val());
                checkForWinner(snapshot.val());
            }
        )
    }, [started]);

    return(
        <div id="wrapper">
            <div id="title">
                <h1>Tic Tac Toe</h1>
                <p>Type your pairing code and start playing instantly with your friends !</p>
            </div>

            <div id="codeWrapper">
                <p> Your code: </p>
                <div>
                    <input
                        type="text"
                        value={ generatedCode }
                    />
                    <button onClick={copyToClipboard}>Copy</button>
                </div>
            </div>

            <div id="formWrapper">
                <form id="form" onSubmit={handleSubmit}>
                    <input
                        value={code}
                        onChange={e => setCode(e.target.value.trim())}
                        type="text"
                        placeholder="Enter pairing code"
                    />

                    <button>Pair</button>
                </form>

                <div id="buttonWrapper">
                    <p>Or</p>
                    <button id="roomButton" onClick={() => {
                        document.getElementById("codeWrapper").style.display = "flex";
                        document.getElementById("form").style.display = "none";
                        document.getElementById("buttonWrapper").style.display = "none";
                        document.getElementById("goBack").style.display = "block";
                    }}>Start Room</button>
                </div>

                <button id="goBack" onClick={() => {
                    document.getElementById("codeWrapper").style.display = "none";
                    document.getElementById("form").style.display = "block";
                    document.getElementById("buttonWrapper").style.display = "flex";
                    document.getElementById("goBack").style.display = "none";
                }}>Go Back</button>
            </div>

            <div id="grid">
                {
                    gridData.map((data, index) =>
                        <button
                            onClick={() => handleClick(index)}
                        >{
                            (data === "none") ? ""
                            : <img src={`./${data}.svg`} alt={data} />
                        }</button>
                    )
                }

                <div id="line"></div>
            </div>
        </div>
    );
}

ReactDOM.render(
    <App />,
    document.getElementById("root")
);
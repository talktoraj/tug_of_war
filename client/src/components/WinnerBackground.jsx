import React, { useEffect } from 'react';
import './WinnerBackground.css';

export default function WinnerBackground({ winnerName, onRestart }) {
    useEffect(() => {
        // Optionally include Twitter/FB scripts if necessary
        // But mostly the user wanted the HTML/CSS animation
    }, []);

    return (
        <div className="winnerBg">
            {/* Overlay Text */}
            <div className="winnerOverlay">
                <div className="winnerNameText">{winnerName}</div>
                <div className="winnerText">Winner</div>
            </div>

            <div className="restartButtonOverlay">
                <button className="restartBtn" onClick={onRestart}>Play Again</button>
            </div>

            {/* The Animated Background HTML */}
            <div className="mainCont">
                <div className="assCheeks">
                    <div className="leftAssCheek"></div>
                    <div className="rightAssCheek"></div>
                    <div className="poopCont">
                        <div className="poopBottomPart"></div>
                        <div className="poopMiddlePart"></div>
                        <div className="poopUpperPart"></div>
                    </div>
                </div>
                <div className="bodyUpperPart"></div>
                <div className="bodyBottomPart">
                    <div className="leftLeg"></div>
                    <div className="rightLeg"></div>
                </div>
            </div>

            <div className="justAnotherShitLinkCont">
                Just another experiment of <a href="http://mahdif.com" target="_blank" rel="noreferrer">a watermelon lover</a>
                &amp; Inspired by <a href="https://twitter.com/banhocheco" target="_blank" rel="noreferrer">João</a>
            </div>
        </div>
    );
}

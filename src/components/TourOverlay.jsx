import React, { useState, useEffect } from 'react';
import './TourOverlay.css';

const TourOverlay = ({ steps, onComplete, onSkip }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [position, setPosition] = useState(null);
    const [targetRect, setTargetRect] = useState(null);

    const currentStep = steps[currentStepIndex];

    useEffect(() => {
        if (!currentStep) return;

        const updatePosition = () => {
            const element = document.querySelector(currentStep.target);
            if (element) {
                const rect = element.getBoundingClientRect();
                // Add padding
                const PADDING = 8;
                setTargetRect({
                    top: rect.top + window.scrollY - PADDING,
                    left: rect.left + window.scrollX - PADDING,
                    width: rect.width + (PADDING * 2),
                    height: rect.height + (PADDING * 2),
                });

                // Simple positioning logic (prefer bottom, fallback to top/center)
                // This can be enhanced
                let top = rect.bottom + window.scrollY + 10;
                let left = rect.left + window.scrollX + (rect.width / 2) - 150; // Center 300px wide tooltip

                // Boundary checks (basic)
                if (left < 10) left = 10;
                if (left + 300 > window.innerWidth) left = window.innerWidth - 310;

                setPosition({ top, left });
            } else {
                // If target not found, maybe just center it or skip?
                // For now, center if targeted specific element but unavailable
                setPosition({
                    top: window.innerHeight / 2 - 100,
                    left: window.innerWidth / 2 - 150,
                    isFallback: true
                });
                setTargetRect(null);
            }
        };

        // Delay slightly to allow rendering
        const timeout = setTimeout(updatePosition, 500);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [currentStepIndex, steps]);

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            onComplete();
        }
    };

    if (!currentStep || !position) return null;

    return (
        <div className="tour-overlay-container">
            {/* Backdrop with hole logic is complex for simple CSS.
                We'll use a semi-transparent overlay and a high z-index target highlight if possible,
                Or just a spotlight effect using box-shadow on the highlight box.
            */}

            {/* The Highlight Box */}
            {targetRect && (
                <div
                    className="tour-highlight-box"
                    style={{
                        top: targetRect.top,
                        left: targetRect.left,
                        width: targetRect.width,
                        height: targetRect.height,
                    }}
                />
            )}

            {/* The Tooltip */}
            <div
                className="tour-tooltip"
                style={{
                    top: position.top,
                    left: position.left,
                }}
            >
                <div className="tour-content">
                    <h4>{currentStep.title}</h4>
                    <p>{currentStep.content}</p>
                </div>
                <div className="tour-actions">
                    <button onClick={onSkip} className="btn-text">Skip</button>
                    <button onClick={handleNext} className="btn-primary-small">
                        {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TourOverlay;

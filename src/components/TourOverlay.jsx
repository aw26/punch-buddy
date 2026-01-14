import React, { useState, useEffect } from 'react';
import './TourOverlay.css';

const TourOverlay = ({ steps, onComplete, onSkip }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [position, setPosition] = useState(null);
    const [targetRect, setTargetRect] = useState(null);
    const [placement, setPlacement] = useState('bottom'); // 'bottom' or 'top'

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

                // Responsive width calc
                const tooltipWidth = Math.min(window.innerWidth * 0.9, 300);

                // Positioning logic
                let top = rect.bottom + window.scrollY + 10;
                let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
                let newPlacement = 'bottom';

                // Smart Vertical Positioning (Flip if needed)
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;

                // If detailed height unknown, assume ~200px. 
                // If tight below (< 220px) and plenty above (> 220px), flip.
                if (spaceBelow < 220 && spaceAbove > 220) {
                    newPlacement = 'top';
                    // Position at top of target. CSS transform will handle the -100% height offset if we can,
                    // or we just position it manually using bottom-up logic?
                    // Easiest with fixed height, but height is dynamic.
                    // Solution: Use bottom-aligned absolute positioning? 
                    // Let's pass 'top' coord as the anchor point, and handle offset in CSS/style.
                    top = rect.top + window.scrollY - 10;
                }

                // Boundary checks for Left
                const PADDING_X = 10;
                if (left < PADDING_X) left = PADDING_X;
                if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - PADDING_X;

                setPosition({ top, left });
                setPlacement(newPlacement);
            } else {
                // Fallback center
                setPosition({
                    top: window.innerHeight / 2 - 100,
                    left: window.innerWidth / 2 - 150, // This might be off if width != 300
                    isFallback: true
                });
                setTargetRect(null);
                setPlacement('bottom');
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
            {/* Highlight Box */}
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

            {/* Tooltip */}
            <div
                className="tour-tooltip"
                style={{
                    top: position.top,
                    left: position.left,
                    // If placement is top, shift up by 100% manually via transform
                    transform: placement === 'top' ? 'translateY(-100%)' : 'none'
                }}
            >
                <button className="tour-close-btn" onClick={onSkip} aria-label="Close tour">
                    ✕
                </button>

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

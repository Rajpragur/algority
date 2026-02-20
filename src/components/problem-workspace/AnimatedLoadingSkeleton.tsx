'use client'

import React, { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'

// Interface for grid configuration structure
interface GridConfig {
    numCards: number // Total number of cards to display
    cols: number // Number of columns in the grid
    xBase: number // Base x-coordinate for positioning
    yBase: number // Base y-coordinate for positioning
    xStep: number // Horizontal step between cards
    yStep: number // Vertical step between cards
}

const AnimatedLoadingSkeleton = () => {
    const [windowWidth, setWindowWidth] = useState(0) // State to store window width for responsiveness
    const controls = useAnimation() // Controls for Framer Motion animations

    // Dynamically calculates grid configuration based on window width
    const getGridConfig = (width: number): GridConfig => {
        const numCards = 6 // Fixed number of cards
        const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1 // Set columns based on screen width
        return {
            numCards,
            cols,
            xBase: 40, // Starting x-coordinate
            yBase: 60, // Starting y-coordinate
            xStep: 210, // Horizontal spacing
            yStep: 230 // Vertical spacing
        }
    }

    // Generates random animation paths for the search icon
    const generateSearchPath = (config: GridConfig) => {
        const { numCards, cols, xBase, yBase, xStep, yStep } = config
        const rows = Math.ceil(numCards / cols) // Calculate rows based on cards and columns
        let allPositions: { x: number; y: number }[] = []

        // Generate grid positions for cards
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if ((row * cols + col) < numCards) {
                    allPositions.push({
                        x: xBase + (col * xStep),
                        y: yBase + (row * yStep)
                    })
                }
            }
        }

        // Shuffle positions to create random animations
        const numRandomCards = 4
        const shuffledPositions = allPositions
            .sort(() => Math.random() - 0.5)
            .slice(0, numRandomCards)

        // Ensure loop completion by adding the starting position
        if (shuffledPositions.length > 0) {
            shuffledPositions.push(shuffledPositions[0])
        }

        return {
            x: shuffledPositions.map(pos => pos.x),
            y: shuffledPositions.map(pos => pos.y),
            scale: Array(shuffledPositions.length).fill(1.2),
            transition: {
                duration: shuffledPositions.length * 2,
                repeat: Infinity, // Loop animation infinitely
                ease: [0.4, 0, 0.2, 1] as any, // Ease function for smooth animation
                times: shuffledPositions.map((_, i) => i / (shuffledPositions.length - 1))
            }
        }
    }

    // Handles window resize events and updates the window width
    useEffect(() => {
        setWindowWidth(window.innerWidth)
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Updates animation path whenever the window width changes
    useEffect(() => {
        if (windowWidth > 0) {
            const config = getGridConfig(windowWidth)
            controls.start(generateSearchPath(config))
        }
    }, [windowWidth, controls])

    // Variants for frame animations
    const frameVariants = {
        hidden: { opacity: 0, scale: 0.95 }, // Initial state (hidden)
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }, // Transition to visible state
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
    }

    // Variants for individual card animations
    const cardVariants = {
        hidden: { y: 20, opacity: 0 }, // Initial state (off-screen)
        visible: (i: number) => ({ // Animate based on card index
            y: 0,
            opacity: 1,
            transition: { delay: i * 0.1, duration: 0.4 } // Staggered animation
        })
    }

    // Glow effect variants for the search icon
    const glowVariants = {
        animate: {
            boxShadow: [
                "0 0 20px rgba(59, 130, 246, 0.2)",
                "0 0 35px rgba(59, 130, 246, 0.4)",
                "0 0 20px rgba(59, 130, 246, 0.2)"
            ],
            scale: [1, 1.1, 1], // Pulsating effect
            transition: {
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut" as any // Smooth pulsation
            }
        }
    }

    // Don't render until client-side hydration to avoid hydration mismatch
    if (windowWidth === 0) return null

    const config = getGridConfig(windowWidth)

    // Calculate container scale to fit within parent if needed
    // For now we'll assume the parent container constrains width

    return (
        <motion.div
            className="w-full max-w-6xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800"
            variants={frameVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-8 min-h-[600px]">
                {/* Search icon with animation */}
                <motion.div
                    className="absolute z-10 pointer-events-none"
                    animate={controls}
                    style={{ left: 0, top: 0 }} // Base position, animated by controls
                >
                    <motion.div
                        className="bg-emerald-500/20 p-3 rounded-full backdrop-blur-sm"
                        variants={glowVariants}
                        animate="animate"
                    >
                        <svg
                            className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </motion.div>
                </motion.div>

                {/* Grid of animated cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(config.numCards)].map((_, i) => (
                        <motion.div
                            key={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            custom={i} // Index-based animation delay
                            className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 h-64 flex flex-col justify-between border border-slate-100 dark:border-slate-700"
                        >
                            <div>
                                {/* Card placeholders */}
                                <motion.div
                                    className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md mb-4"
                                    animate={{
                                        opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                                <motion.div
                                    className="h-4 w-full bg-slate-100 dark:bg-slate-700/50 rounded mb-2"
                                    animate={{
                                        opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div
                                    className="h-4 w-5/6 bg-slate-100 dark:bg-slate-700/50 rounded"
                                    animate={{
                                        opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                />
                            </div>

                            <div className="flex gap-2">
                                <motion.div
                                    className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                                />
                                <motion.div
                                    className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

export default AnimatedLoadingSkeleton

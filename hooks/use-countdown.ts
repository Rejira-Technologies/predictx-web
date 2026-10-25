"use client";

import { useState, useEffect } from "react";

export type TimerStatus =
	| "safe"
	| "warning"
	| "urgent"
	| "critical"
	| "expired";

export interface CountdownResult {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	isExpired: boolean;
	status: TimerStatus;
}

function getStatus(totalSecs: number): TimerStatus {
	if (totalSecs <= 0) return "expired";
	if (totalSecs < 5 * 60) return "critical"; // < 5 min
	if (totalSecs < 15 * 60) return "urgent"; // 5–15 min
	if (totalSecs < 60 * 60) return "warning"; // 15–60 min
	return "safe"; // > 1 h
}

function compute(targetISO: string): CountdownResult {
	const diff = Math.max(
		0,
		Math.floor((new Date(targetISO).getTime() - Date.now()) / 1000),
	);
	return {
		days: Math.floor(diff / 86_400),
		hours: Math.floor((diff % 86_400) / 3_600),
		minutes: Math.floor((diff % 3_600) / 60),
		seconds: diff % 60,
		isExpired: diff === 0,
		status: getStatus(diff),
	};
}

export function useCountdown(targetISO: string): CountdownResult {
	const [state, setState] = useState<CountdownResult>(() => {
		return {
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0,
			isExpired: false,
			status: "safe",
		};
	});

	useEffect(() => {
		setState(compute(targetISO));
		const id = setInterval(() => setState(compute(targetISO)), 1_000);
		return () => clearInterval(id);
	}, [targetISO]);

	return state;
}

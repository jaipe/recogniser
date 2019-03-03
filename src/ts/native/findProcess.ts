import * as robotjs from "robot-js";
import { Rect } from "bot-core";

async function getWindowByProcessName(processName) {
	function getProcess() {
		return new Promise(resolve => {
			function findProcess() {
				const processList = robotjs.Process.getList(processName);

				return processList.length ? processList[0] : null;
			}

			function attemptProcessResolution() {
				const foundProcess = findProcess();
				if (foundProcess) {
					resolve(foundProcess);
				} else {
					setTimeout(attemptProcessResolution, 500);

					console.log("Process not found. Retrying.");
				}
			}

			attemptProcessResolution();
		});
	}

	function getWindowByProcess(process) {
		return new Promise(resolve => {
			function findWindow() {
				const windows = process.getWindows();

				return windows.length ? windows[0] : null;
			}

			function attemptWindowResolution() {
				const foundWindow = findWindow();
				if (foundWindow) {
					resolve(foundWindow);
				} else {
					setTimeout(attemptWindowResolution, 500);

					console.log("Window not found. Retrying.");
				}
			}

			attemptWindowResolution();
		});
	}

	return getWindowByProcess(await getProcess());
}

export interface Process {
	getWindowSize(): Promise<Rect>;
	bringToFront(): Promise<Process>;
};

export default async function findProcess(processName = "Wow.exe"): Promise<Process> {
	const targetWindow: any = await getWindowByProcessName(processName);

	function getWindowSize(): Rect {
		const { x, y, w: width, h: height } = targetWindow.getBounds();

		return { x, y, width, height };
	}

	return {
		getWindowSize(): Promise<Rect> {
			return Promise.resolve(getWindowSize());
		},
		bringToFront(): Promise<Process> {
			robotjs.Window.setActive(targetWindow);
			return Promise.resolve(this);
		}
	};
}

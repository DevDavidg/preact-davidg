import { FunctionComponent } from "preact";
import { useEffect, useState } from "preact/hooks";
import PerformanceMonitor from "../utils/PerformanceMonitor";

interface PerformanceNotifierProps {
  threshold?: number;
}

const PerformanceNotifier: FunctionComponent<PerformanceNotifierProps> = ({
  threshold = 30,
}) => {
  const [showNotification, setShowNotification] = useState(false);
  const [fpsIssue, setFpsIssue] = useState(false);
  const [memoryIssue, setMemoryIssue] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");

  useEffect(() => {
    if (dismissed) return;

    try {
      const wasDismissed =
        localStorage.getItem("performance-notifier-dismissed") === "true";
      if (wasDismissed) {
        setDismissed(true);
        return;
      }
    } catch (e) {}

    const monitor = PerformanceMonitor.getInstance();

    const checkInterval = setInterval(() => {
      try {
        const report = monitor.getPerformanceReport();

        if (report.logs.length > 20) {
          const recentLogs = report.logs.slice(-20);
          const avgFps =
            recentLogs.reduce((sum, entry) => sum + (entry.fps || 0), 0) /
            recentLogs.length;

          const memoryEntries = recentLogs.filter(
            (entry) => entry.memoryUsage !== undefined
          );
          let memoryGrowth = 0;

          if (memoryEntries.length > 5) {
            const firstEntry = memoryEntries[0].memoryUsage || 0;
            const lastEntry =
              memoryEntries[memoryEntries.length - 1].memoryUsage || 0;
            memoryGrowth = ((lastEntry - firstEntry) / firstEntry) * 100;
          }

          const hasFpsIssue = avgFps < threshold;
          const hasMemoryIssue = memoryGrowth > 15;

          if (hasFpsIssue || hasMemoryIssue) {
            setFpsIssue(hasFpsIssue);
            setMemoryIssue(hasMemoryIssue);

            let description = "";
            if (hasFpsIssue) {
              description += `Low frame rate detected (${Math.round(
                avgFps
              )} FPS). `;
            }
            if (hasMemoryIssue) {
              description += `High memory usage growth (${Math.round(
                memoryGrowth
              )}%). `;
            }

            setIssueDescription(description);
            setShowNotification(true);
          }
        }
      } catch (error) {
        console.error("Error in performance check:", error);
      }
    }, 5000);

    return () => {
      clearInterval(checkInterval);
    };
  }, [threshold, dismissed]);

  const handleDismiss = () => {
    setShowNotification(false);
    setDismissed(true);

    try {
      localStorage.setItem("performance-notifier-dismissed", "true");
    } catch (e) {}
  };

  const handleShowMonitor = () => {
    setShowNotification(false);

    if (window.showPerformanceMonitor) {
      window.showPerformanceMonitor();
    }
  };

  if (!showNotification) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-yellow-700/90 text-white p-3 rounded-md shadow-lg backdrop-blur-sm z-50 max-w-xs animate-fade-in">
      <div className="flex items-start">
        <div className="mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div>
          <h4 className="font-medium mb-1">Performance Issue Detected</h4>
          <p className="text-xs text-yellow-200 mb-2">
            {issueDescription}
            This may affect your experience.
          </p>
          <div className="flex space-x-2">
            <button
              className="text-xs py-1 px-2 bg-yellow-800 hover:bg-yellow-600 rounded"
              onClick={handleShowMonitor}
            >
              Diagnose
            </button>
            <button
              className="text-xs py-1 px-2 hover:underline"
              onClick={handleDismiss}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceNotifier;

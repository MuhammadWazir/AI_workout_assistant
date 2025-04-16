"use client"
import { useParams, useLocation, Link } from "react-router-dom"
import { CircularProgressbar, buildStyles } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"
import "./report.css"

function Report() {
  const { name } = useParams()
  const location = useLocation()
  const { results, report } = location.state || {}

  // Check if the set counts (minimum 3 reps)
  const setCountsAsValid = report && report.repCount >= 3

  // Format mistake type for display
  const formatMistakeType = (mistakeType) => {
    return mistakeType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Get color based on percentage (lower is better)
  const getColorForPercentage = (percentage) => {
    if (percentage < 20) return "#4CAF50" // Green
    if (percentage < 40) return "#8BC34A" // Light Green
    if (percentage < 60) return "#FFC107" // Yellow
    if (percentage < 80) return "#FF9800" // Orange
    return "#F44336" // Red
  }

  // Calculate overall form score (100 - average mistake percentage)
  const calculateOverallScore = () => {
    if (!report || !report.mistakePercentages) return 100

    const mistakeValues = Object.values(report.mistakePercentages)
    if (mistakeValues.length === 0) return 100

    const averageMistake = mistakeValues.reduce((sum, val) => sum + val, 0) / mistakeValues.length
    return Math.max(0, Math.min(100, 100 - averageMistake))
  }

  const overallScore = calculateOverallScore()

  // If the set doesn't count, show a different view
  if (!setCountsAsValid) {
    return (
      <div className="report-container">
        <div className="report-header">
          <h1 className="report-title">Exercise Report</h1>
          <h2 className="report-exercise-name">{name.replace(/_/g, " ")}</h2>
        </div>

        <div className="invalid-set">
          <div className="invalid-set-icon">⚠️</div>
          <h3>Set Does Not Count</h3>
          <p>
            You completed <span className="highlight">{report?.repCount || 0} repetitions</span>.
          </p>
          <p>A minimum of 3 repetitions is required for a valid set.</p>
        </div>

        <div className="report-actions">
          <Link to={`/exercise/${name}`} className="action-button primary">
            Try Again
          </Link>
          <Link to="/dashboard" className="action-button secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="report-container">
      <div className="report-header">
        <h1 className="report-title">Exercise Report</h1>
        <h2 className="report-exercise-name">{name.replace(/_/g, " ")}</h2>
      </div>

      <div className="report-content">
        <div className="report-summary">
          <div className="overall-score">
            <h3>Overall Form Score</h3>
            <div className="score-circle">
              <CircularProgressbar
                value={overallScore}
                text={`${Math.round(overallScore)}%`}
                styles={buildStyles({
                  textSize: "16px",
                  pathColor: getColorForPercentage(100 - overallScore),
                  textColor: "#333",
                  trailColor: "#d6d6d6",
                })}
              />
            </div>
          </div>

          <div className="rep-count">
            <h3>Repetitions</h3>
            <div className="rep-number">{report?.repCount || 0}</div>
          </div>
        </div>

        <div className="mistakes-analysis">
          <h3>Form Analysis</h3>

          {report && report.mistakePercentages && Object.keys(report.mistakePercentages).length > 0 ? (
            <div className="mistakes-grid">
              {Object.entries(report.mistakePercentages).map(([mistakeType, percentage], index) => (
                <div className="mistake-item" key={index}>
                  <div className="mistake-chart">
                    <CircularProgressbar
                      value={percentage}
                      text={`${Math.round(percentage)}%`}
                      styles={buildStyles({
                        textSize: "16px",
                        pathColor: getColorForPercentage(percentage),
                        textColor: "#333",
                        trailColor: "#d6d6d6",
                      })}
                    />
                  </div>
                  <div className="mistake-details">
                    <div className="mistake-label">{formatMistakeType(mistakeType)}</div>
                    <div className="mistake-percentage">{Math.round(percentage)}% of frames</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-mistakes">No form issues detected. Great job!</p>
          )}
        </div>

        <div className="feedback-section">
          <h3>Feedback</h3>
          <div className="feedback-content">
            {report && report.mistakePercentages ? (
              <ul className="feedback-list">
                {Object.entries(report.mistakePercentages)
                  .sort(([, a], [, b]) => b - a)
                  .map(([mistakeType, percentage], index) => {
                    if (percentage > 20) {
                      return (
                        <li key={index} className="feedback-item">
                          <div className="feedback-header">
                            <span className="feedback-highlight">{formatMistakeType(mistakeType)}</span>
                            <span className="feedback-percentage">{Math.round(percentage)}%</span>
                          </div>
                          <div className="feedback-text">{getFeedbackForMistake(mistakeType, percentage)}</div>
                        </li>
                      )
                    }
                    return null
                  })
                  .filter((item) => item !== null)}
              </ul>
            ) : (
              <p>No specific feedback available for this session.</p>
            )}

            {(!report?.mistakePercentages || Object.values(report.mistakePercentages).every((p) => p <= 20)) && (
              <p className="positive-feedback">Your form looks great! Keep up the good work.</p>
            )}
          </div>
        </div>
      </div>

      <div className="report-actions">
        <Link to={`/exercise/${name}`} className="action-button primary">
          Try Again
        </Link>
        <Link to="/dashboard" className="action-button secondary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

// Helper function to generate feedback based on mistake type and percentage
function getFeedbackForMistake(mistakeType, percentage) {
  const severity = percentage > 60 ? "significant" : "slight"

  const feedbackMap = {
    curvedArms: `You have a ${severity} tendency to bend your arms during the exercise. Try to keep your arms straight for better form.`,
    standingUpright: `Make sure to maintain an upright posture throughout the exercise.`,
    armsTooWide: `Your arms are positioned too wide. Bring them closer to your body for proper form.`,
    bentArms: `Focus on keeping your arms straight during the movement for better muscle engagement.`,
    leaningBody: `Try to avoid leaning your body during the exercise. Maintain a stable core position.`,
    wristsTooNarrow: `Your wrists are positioned too narrowly. Widen your grip for better form and safety.`,
    flaredElbows: `Your elbows are flaring out too much. Keep them closer to your body for proper form.`,
    bentArmsAtBreakpoint: `You're bending your arms at the critical point of the exercise. Maintain proper form throughout the movement.`,
    back_too_high: `Your back is arching too high during the plank. Focus on maintaining a flat back position.`,
    back_too_low: `Your back is dipping too low during the plank. Engage your core to maintain a straight line from head to heels.`,
    leaned_back: `You're leaning back during the exercise. Keep your torso upright and stable.`,
    knee_over_toe: `Your knee is extending past your toes, which can strain your joints. Keep your knee aligned with your ankle.`,
  }

  return feedbackMap[mistakeType] || `Work on improving your ${formatMistakeType(mistakeType).toLowerCase()} technique.`
}

// Helper function to format mistake type for display
function formatMistakeType(mistakeType) {
  return mistakeType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default Report

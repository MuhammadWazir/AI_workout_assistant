import "./hero-section.css"

const HeroSection = ({mounted}) => {
  // Function to handle button click and scroll to exercises using ID
  const scrollToExercises = () => {
    // Get the element by ID
    const exercisesSection = document.getElementById('exercises');
    
    // If the element exists, scroll to it smoothly
    if (exercisesSection) {
      exercisesSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <section className={`hero-section ${mounted ? 'fade-in' : ''}`}>
      <div className="hero-image-container">
        <img src="./home_image.png" alt="Fitness training" className="hero-background-image" />
        <div className="hero-content-overlay">
          <div className="hero-text">
            <h1>ELEVATE YOUR FITNESS</h1>
            <p>Track your progress. Achieve your goals. Transform your body.</p>
            <button className="hero-button" onClick={scrollToExercises}>Start Now</button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
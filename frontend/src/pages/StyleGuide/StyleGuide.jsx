import "./StyleGuide.scss";

function StyleGuide() {
  return (
    <div className="style-guide">
      <h1>Community Carpooling Design System</h1>

      <section>
        <h2>Colors</h2>

        <div className="color-grid">
          <div className="color-box primary">Primary</div>
          <div className="color-box secondary">Secondary</div>
          <div className="color-box accent">Accent</div>
          <div className="color-box success">Success</div>
          <div className="color-box warning">Warning</div>
          <div className="color-box danger">Danger</div>
        </div>
      </section>

      <section>
        <h2>Buttons</h2>

        <button className="btn btn-primary">Primary Button</button>

        <button className="btn btn-success">Success Button</button>

        <button className="btn btn-outline">Outline Button</button>
      </section>

      <section>
        <h2>Cards</h2>

        <div className="card">
          <h3>Ride Card</h3>
          <p>Shared component example.</p>
        </div>
      </section>

      <section>
        <h2>Typography</h2>

        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>

        <p>Standard paragraph text.</p>
      </section>

      <section>
        <h2>Spacing</h2>

        <div className="spacing-demo">Margin & Padding Demo</div>
      </section>
    </div>
  );
}

export default StyleGuide;

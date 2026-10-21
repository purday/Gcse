// Must-know facts for AQA 8300 Higher: formulas and facts the exam does NOT give.
// (AQA prints the cone and sphere formulas in the question when they are needed.)

const md = String.raw;

export const CARDS = [
  { id: 'quad-formula', topic: 'A18', front: 'The quadratic formula for $ax^2 + bx + c = 0$', back: md`$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$` },
  { id: 'discriminant', topic: 'A18', front: md`What does $b^2 - 4ac$ tell you?`, back: md`$> 0$: two solutions · $= 0$: one (repeated) solution · $< 0$: no real solutions` },
  { id: 'pythag', topic: 'G20', front: 'Pythagoras’ theorem', back: md`$a^2 + b^2 = c^2$ where $c$ is the **hypotenuse** (longest side, opposite the right angle)` },
  { id: 'sohcahtoa', topic: 'G20', front: 'The three trig ratios (right-angled triangle)', back: md`$\sin\theta = \frac{O}{H}$, $\cos\theta = \frac{A}{H}$, $\tan\theta = \frac{O}{A}$ (SOH CAH TOA)` },
  { id: 'exact-trig', topic: 'G21', front: 'Exact values: sin, cos, tan of 30°, 45°, 60°', back: md`$\sin 30 = \frac12$, $\sin 45 = \frac{\sqrt2}{2}$, $\sin 60 = \frac{\sqrt3}{2}$
$\cos 30 = \frac{\sqrt3}{2}$, $\cos 45 = \frac{\sqrt2}{2}$, $\cos 60 = \frac12$
$\tan 30 = \frac{\sqrt3}{3}$, $\tan 45 = 1$, $\tan 60 = \sqrt3$` },
  { id: 'exact-trig-0-90', topic: 'G21', front: 'sin, cos, tan of 0° and 90°', back: md`$\sin 0 = 0$, $\cos 0 = 1$, $\tan 0 = 0$, $\sin 90 = 1$, $\cos 90 = 0$ ($\tan 90$ is undefined)` },
  { id: 'sine-rule', topic: 'G22', front: 'The sine rule', back: md`$$\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C}$$ Use it when you know a side **and its opposite angle**.` },
  { id: 'cosine-rule', topic: 'G22', front: 'The cosine rule', back: md`$a^2 = b^2 + c^2 - 2bc\cos A$
Use it for two sides and the angle **between** them, or all three sides (to find an angle).` },
  { id: 'area-sin', topic: 'G23', front: 'Area of any triangle using sine', back: md`$\text{Area} = \frac12 ab\sin C$ ($C$ is the angle between sides $a$ and $b$)` },
  { id: 'circle', topic: 'G17', front: 'Circumference and area of a circle', back: md`$C = \pi d = 2\pi r$, $\quad A = \pi r^2$` },
  { id: 'sector', topic: 'G18', front: 'Arc length and sector area for angle θ', back: md`Arc $= \frac{\theta}{360} \times 2\pi r$, $\quad$ Sector area $= \frac{\theta}{360} \times \pi r^2$` },
  { id: 'trapezium', topic: 'G16', front: 'Area of a trapezium', back: md`$\frac12(a + b)h$ (the two parallel sides added, halved, times the height)` },
  { id: 'prism', topic: 'G16', front: 'Volume of a prism (and cylinder)', back: md`Area of cross-section × length. Cylinder: $\pi r^2 h$` },
  { id: 'cylinder-sa', topic: 'G17', front: 'Curved surface area of a cylinder', back: md`$2\pi r h$ (plus $2\pi r^2$ for the two ends)` },
  { id: 'interior', topic: 'G3', front: 'Interior angles of a polygon with n sides', back: md`Sum $= (n - 2) \times 180°$. Each exterior angle of a regular polygon $= \frac{360°}{n}$` },
  { id: 'parallel-angles', topic: 'G3', front: 'Angle facts with parallel lines', back: 'Alternate angles are equal (Z), corresponding angles are equal (F), co-interior angles add to 180° (C).' },
  { id: 'circle-theorems', topic: 'G10', front: 'The circle theorems (names to quote)', back: md`- Angle at the centre is **twice** the angle at the circumference
- Angle in a **semicircle** is 90°
- Angles in the **same segment** are equal
- Opposite angles of a **cyclic quadrilateral** add to 180°
- **Tangent** meets the radius at 90°
- **Two tangents** from a point are equal in length
- **Alternate segment** theorem
- The perpendicular from the centre to a **chord** bisects the chord` },
  { id: 'indices', topic: 'N7', front: 'The laws of indices', back: md`$a^m \times a^n = a^{m+n}$, $\;a^m \div a^n = a^{m-n}$, $\;(a^m)^n = a^{mn}$
$a^0 = 1$, $\;a^{-n} = \frac{1}{a^n}$, $\;a^{\frac1n} = \sqrt[n]{a}$, $\;a^{\frac mn} = (\sqrt[n]{a})^m$` },
  { id: 'surds', topic: 'N8', front: 'Rules for surds', back: md`$\sqrt{ab} = \sqrt a\sqrt b$, $\;\sqrt{\frac ab} = \frac{\sqrt a}{\sqrt b}$, $\;\sqrt a \times \sqrt a = a$
Rationalise $\frac{1}{\sqrt a}$ by multiplying top and bottom by $\sqrt a$.` },
  { id: 'stdform', topic: 'N9', front: 'Standard form', back: md`$A \times 10^n$ with $1 \le A < 10$ and $n$ an integer. Big numbers: $n > 0$. Small numbers: $n < 0$.` },
  { id: 'bounds', topic: 'N16', front: 'Bounds when dividing: largest possible value of a ÷ b', back: md`**Upper** bound of $a$ ÷ **lower** bound of $b$. (Smallest value: lower ÷ upper.)` },
  { id: 'error-interval', topic: 'N15', front: 'Error interval: x = 6.4 to 1 decimal place', back: md`$6.35 \le x < 6.45$ (half a unit either side; the top is **<**, not ≤)` },
  { id: 'line', topic: 'A9', front: 'Equation of a straight line and gradient between two points', back: md`$y = mx + c$, $\;m = \frac{y_2 - y_1}{x_2 - x_1}$, $c$ = where it crosses the $y$-axis` },
  { id: 'perpendicular', topic: 'A9', front: 'Gradients of parallel and perpendicular lines', back: md`Parallel: **same** gradient. Perpendicular: gradients multiply to $-1$, so $m_2 = -\frac{1}{m_1}$` },
  { id: 'circle-eq', topic: 'A16', front: 'Equation of a circle, centre the origin', back: md`$x^2 + y^2 = r^2$. The tangent at a point is perpendicular to the radius there.` },
  { id: 'compound', topic: 'R16', front: 'Compound interest / depreciation', back: md`Amount $= P \times \left(1 \pm \frac{r}{100}\right)^n$. 4% growth → multiplier 1.04; 15% loss → 0.85` },
  { id: 'reverse-pc', topic: 'R9', front: 'Reverse percentage: after a 20% increase it costs £84. Original?', back: md`Divide by the multiplier: $84 \div 1.2 = £70$ (never take 20% off £84)` },
  { id: 'speed', topic: 'R11', front: 'Speed, density, pressure', back: md`Speed = distance ÷ time · Density = mass ÷ volume · Pressure = force ÷ area` },
  { id: 'proportion', topic: 'R13', front: 'Direct and inverse proportion equations', back: md`$y \propto x \Rightarrow y = kx$ · $y \propto x^2 \Rightarrow y = kx^2$ · $y \propto \frac1x \Rightarrow y = \frac kx$. Find $k$ from the values given first.` },
  { id: 'similar', topic: 'G19', front: 'Similar shapes: length scale factor k', back: md`Area scale factor $k^2$, volume scale factor $k^3$` },
  { id: 'nth-linear', topic: 'A25', front: 'nth term of a linear sequence', back: md`$dn + (\text{first term} - d)$ where $d$ is the common difference. 5, 8, 11 → $3n + 2$` },
  { id: 'nth-quad', topic: 'A25', front: 'nth term of a quadratic sequence: method', back: 'Second difference ÷ 2 gives the n² coefficient. Subtract that n² part from each term; find the linear nth term of what is left; add them.' },
  { id: 'prob-and-or', topic: 'P8', front: 'AND / OR rules for probability', back: md`Independent AND: **multiply**. Mutually exclusive OR: **add**. $P(\text{not } A) = 1 - P(A)$` },
  { id: 'conditional', topic: 'P9', front: 'Conditional probability P(A given B)', back: md`$P(A \mid B) = \frac{P(A \cap B)}{P(B)}$: only count within the "given" group.` },
  { id: 'fd', topic: 'S3', front: 'Frequency density (histograms)', back: md`Frequency density = frequency ÷ class width. Frequency = **area** of the bar.` },
  { id: 'iqr', topic: 'S4', front: 'Interquartile range', back: 'Upper quartile − lower quartile. It measures spread of the middle half and is not affected by outliers.' },
  { id: 'compare', topic: 'S4', front: 'Comparing two distributions: what to write', back: 'One comparison of an **average** (median/mean) and one of **spread** (IQR/range), each **in context**: "On average Class A scored higher because its median is higher".' },
  { id: 'mean-table', topic: 'S4', front: 'Estimate the mean from a grouped table', back: 'Multiply each class **midpoint** by its frequency, add them up, divide by the total frequency.' },
  { id: 'vectors', topic: 'G25', front: 'Proving points are on a straight line with vectors', back: md`Show one vector is a multiple of the other (so they are **parallel**) **and** they share a point. E.g. $\overrightarrow{AC} = 3\overrightarrow{AB}$` },
  { id: 'iteration', topic: 'A20', front: 'Iteration: what to do with $x_{n+1} = \dots$', back: 'Put x₀ in, get x₁, put x₁ back in. Use ANS on the calculator. Stop when the required decimal places stop changing.' },
  { id: 'functions', topic: 'A7', front: 'Composite fg(x) and inverse f⁻¹(x)', back: md`$fg(x)$: do **g first**, then f. Inverse: write $y = f(x)$, swap to make $x$ the subject, then replace $y$ with $x$.` },
  { id: 'turning-point', topic: 'A11', front: md`Turning point of $y = (x + p)^2 + q$`, back: md`$(-p, \; q)$. Example: $y = (x - 3)^2 + 5$ has its minimum at $(3, 5)$.` },
  { id: 'time-marks', topic: 'A1', front: 'Exam timing', back: '80 marks in 90 minutes: about 1 mark per minute, with 10 minutes to check. Do not spend 8 minutes on a 2-mark question.' },
];

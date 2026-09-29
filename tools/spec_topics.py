"""AQA GCSE Mathematics 8300 subject content references (same codes as the DfE
subject content). Each topic has a short name for the app, the spec wording
for the tutor, a strand, whether it is Higher-only content, a rough grade band
for where Higher questions on it usually sit, and keywords used by the
auto-tagger (tools/tagger.py) as a first pass before manual review.

Run directly to write app/data/topics.json.
"""
import json
import pathlib

STRANDS = {
    "N": "Number",
    "A": "Algebra",
    "R": "Ratio, proportion and rates of change",
    "G": "Geometry and measures",
    "P": "Probability",
    "S": "Statistics",
}

# code: (short name, band, higher_only, keywords, spec wording)
T = {
 "N1": ("Ordering numbers and inequality symbols", "4-5", False, ["order", "ascending", "descending"], "Order positive and negative integers, decimals and fractions; use the symbols =, ≠, <, >, ≤, ≥."),
 "N2": ("Four operations incl. fractions and negatives", "4-5", False, ["mixed number", "work out", "improper"], "Apply the four operations, including formal written methods, to integers, decimals and simple fractions (proper and improper), and mixed numbers, all both positive and negative; understand and use place value."),
 "N3": ("Inverse operations and order of operations", "4-5", False, ["reciprocal", "brackets"], "Recognise and use relationships between operations, including inverse operations; use conventional notation for priority of operations, including brackets, powers, roots and reciprocals."),
 "N4": ("Primes, factors, HCF, LCM, prime factorisation", "4-5", False, ["prime factor", "highest common factor", "lowest common multiple", "hcf", "lcm", "product of prime", "factor", "multiple"], "Use the concepts and vocabulary of prime numbers, factors, multiples, common factors, common multiples, HCF, LCM, prime factorisation, including using product notation and the unique factorisation theorem."),
 "N5": ("Systematic listing and product rule for counting", "7", True, ["combinations", "how many different", "arrangements", "codes", "list all"], "Apply systematic listing strategies, including use of the product rule for counting."),
 "N6": ("Powers and roots, estimating them", "4-5", False, ["square root", "cube root", "power of"], "Use positive integer powers and associated real roots (square, cube and higher), recognise powers of 2, 3, 4, 5; estimate powers and roots of any given positive number."),
 "N7": ("Negative and fractional indices", "6", True, ["index", "indices", "power of -", "^{-", "^{\\frac"], "Calculate with roots, and with integer and fractional indices."),
 "N8": ("Exact calculation: surds, π, rationalising", "7", True, ["surd", "rationalise", "simplest form", "\\sqrt", "exact", "in terms of π", "in terms of pi"], "Calculate exactly with fractions, surds and multiples of π; simplify surd expressions involving squares and rationalise denominators."),
 "N9": ("Standard form", "4-5", False, ["standard form", "× 10", "x 10^"], "Calculate with and interpret standard form A × 10^n, where 1 ≤ A < 10 and n is an integer."),
 "N10": ("Recurring decimals and fractions", "7", True, ["recurring", "terminating"], "Work interchangeably with terminating decimals and their corresponding fractions; change recurring decimals into their corresponding fractions and vice versa."),
 "N11": ("Fractions in ratio problems", "4-5", False, ["fraction of"], "Identify and work with fractions in ratio problems."),
 "N12": ("Fractions and percentages as operators", "4-5", False, ["% of", "fraction of"], "Interpret fractions and percentages as operators."),
 "N13": ("Standard units and measures", "4-5", False, ["units", "convert"], "Use standard units of mass, length, time, money and other measures (including standard compound measures) using decimal quantities where appropriate."),
 "N14": ("Estimation and checking", "4-5", False, ["estimate", "approximate", "overestimate", "underestimate"], "Estimate answers; check calculations using approximation and estimation, including answers obtained using technology."),
 "N15": ("Rounding and error intervals", "4-5", False, ["error interval", "rounded to", "truncated", "significant figure", "decimal place"], "Round numbers and measures to an appropriate degree of accuracy; use inequality notation to specify simple error intervals due to truncation or rounding."),
 "N16": ("Upper and lower bounds", "7", True, ["upper bound", "lower bound", "bounds", "limits of accuracy"], "Apply and interpret limits of accuracy, including upper and lower bounds."),
 "A1": ("Algebraic notation", "4-5", False, [], "Use and interpret algebraic notation."),
 "A2": ("Substitution into formulae", "4-5", False, ["substitute", "when x ="], "Substitute numerical values into formulae and expressions, including scientific formulae."),
 "A3": ("Expressions, equations, formulae, identities", "4-5", False, ["identity", "expression", "formula", "equation"], "Understand and use the concepts and vocabulary of expressions, equations, formulae, identities, inequalities, terms and factors."),
 "A4": ("Expanding, factorising, algebraic fractions, index laws", "6", False, ["expand", "factorise", "simplify", "algebraic fraction", "fully"], "Simplify and manipulate algebraic expressions (including those involving surds and algebraic fractions): collect like terms, expand products of two or more binomials, factorise quadratics including ax² + bx + c and difference of two squares, simplify using the laws of indices."),
 "A5": ("Rearranging formulae (change the subject)", "6", False, ["make", "the subject", "rearrange"], "Understand and use standard mathematical formulae; rearrange formulae to change the subject."),
 "A6": ("Algebraic proof and identities", "7", False, ["prove", "show that", "identity", "≡", "odd", "even", "consecutive"], "Know the difference between an equation and an identity; argue mathematically to show algebraic expressions are equivalent, and use algebra to support and construct arguments and proofs."),
 "A7": ("Functions: inverse and composite", "7", True, ["f(x)", "g(x)", "fg(", "gf(", "inverse", "f^{-1}", "composite"], "Interpret simple expressions as functions with inputs and outputs; interpret the reverse process as the inverse function; interpret the succession of two functions as a composite function."),
 "A8": ("Coordinates in four quadrants", "4-5", False, ["coordinates", "midpoint"], "Work with coordinates in all four quadrants."),
 "A9": ("Straight-line graphs, parallel and perpendicular", "6", False, ["y = mx", "gradient", "straight line", "perpendicular", "parallel", "equation of the line"], "Plot straight-line graphs; use y = mx + c to identify parallel and perpendicular lines; find the equation of the line through two given points, or through one point with a given gradient."),
 "A10": ("Gradients and intercepts", "4-5", False, ["gradient", "intercept"], "Identify and interpret gradients and intercepts of linear functions graphically and algebraically."),
 "A11": ("Quadratic graphs: roots, turning points, completing the square", "7", False, ["turning point", "completing the square", "minimum point", "maximum point", "roots"], "Identify and interpret roots, intercepts, turning points of quadratic functions graphically; deduce roots algebraically and turning points by completing the square."),
 "A12": ("Recognising and sketching graphs (cubic, reciprocal, exponential, trig)", "6", False, ["sketch", "cubic", "reciprocal", "exponential", "y = sin", "y = cos", "y = tan", "sin x", "cos x"], "Recognise, sketch and interpret graphs of linear, quadratic, simple cubic, reciprocal y = 1/x, exponential y = k^x, and trigonometric functions for angles of any size."),
 "A13": ("Transformations of graphs", "8-9", True, ["f(x + ", "f(x - ", "-f(x)", "f(-x)", "translation of the graph", "transformation"], "Sketch translations and reflections of a given function."),
 "A14": ("Real-life and non-standard graphs", "4-5", False, ["graph shows", "distance-time", "conversion graph"], "Plot and interpret graphs (including reciprocal and exponential graphs) and graphs of non-standard functions in real contexts, including simple kinematic problems."),
 "A15": ("Gradients of curves and areas under graphs", "8-9", True, ["area under", "velocity-time", "speed-time", "tangent to the curve", "rate of change", "acceleration"], "Calculate or estimate gradients of graphs and areas under graphs (including non-linear graphs), and interpret results in contexts such as distance-time, velocity-time and financial graphs."),
 "A16": ("Equation of a circle and tangent", "8-9", True, ["x^2 + y^2", "x² + y²", "circle", "tangent"], "Recognise and use the equation of a circle with centre at the origin; find the equation of a tangent to a circle at a given point."),
 "A17": ("Linear equations", "4-5", False, ["solve"], "Solve linear equations in one unknown algebraically (including unknowns on both sides); find approximate solutions using a graph."),
 "A18": ("Quadratic equations (factorise, formula, completing the square)", "6", False, ["quadratic", "solve", "x^2", "x²", "quadratic formula", "decimal places"], "Solve quadratic equations (including those that require rearrangement) algebraically by factorising, by completing the square and by using the quadratic formula; find approximate solutions using a graph."),
 "A19": ("Simultaneous equations (linear and linear/quadratic)", "6", False, ["simultaneous", "solve the simultaneous"], "Solve two simultaneous equations in two variables (linear/linear or linear/quadratic) algebraically; find approximate solutions using a graph."),
 "A20": ("Iteration", "7", True, ["iteration", "x_{n+1}", "x_n", "iterative", "starting with"], "Find approximate solutions to equations numerically using iteration."),
 "A21": ("Forming and solving equations from context", "4-5", False, ["form an equation", "set up"], "Translate simple situations or procedures into algebraic expressions or formulae; derive an equation (or two simultaneous equations), solve and interpret the solution."),
 "A22": ("Inequalities (linear, quadratic, regions)", "6", False, ["inequality", "inequalities", "region", "integer values", "≤", "<"], "Solve linear inequalities in one or two variables, and quadratic inequalities in one variable; represent the solution set on a number line, using set notation and on a graph."),
 "A23": ("Generating sequences", "4-5", False, ["sequence", "term"], "Generate terms of a sequence from either a term-to-term or a position-to-term rule."),
 "A24": ("Special sequences (geometric, quadratic, Fibonacci)", "6", False, ["geometric", "fibonacci", "common ratio", "sequence"], "Recognise and use sequences of triangular, square and cube numbers, arithmetic progressions, Fibonacci-type sequences, quadratic sequences, and simple geometric progressions."),
 "A25": ("nth term (linear and quadratic)", "7", False, ["nth term", "n th term", "n^2"], "Deduce expressions to calculate the nth term of linear and quadratic sequences."),
 "R1": ("Converting units incl. area/volume and compound units", "4-5", False, ["convert", "cm^2", "cm²", "m^3", "litres"], "Change freely between related standard units and compound units in numerical and algebraic contexts."),
 "R2": ("Scale factors, scale diagrams and maps", "4-5", False, ["scale", "map", "1 :"], "Use scale factors, scale diagrams and maps."),
 "R3": ("One quantity as a fraction of another", "4-5", False, ["as a fraction of"], "Express one quantity as a fraction of another."),
 "R4": ("Ratio notation and simplifying", "4-5", False, ["ratio", "simplest form"], "Use ratio notation, including reduction to simplest form."),
 "R5": ("Sharing in a ratio and ratio problems", "4-5", False, ["ratio", "shared", "share"], "Divide a quantity in a given part:part or part:whole ratio; express a division as a ratio; apply ratio to real contexts and problems."),
 "R6": ("Multiplicative relationships as ratios", "4-5", False, ["times as many", "ratio"], "Express a multiplicative relationship between two quantities as a ratio or a fraction."),
 "R7": ("Proportion as equality of ratios", "4-5", False, ["proportion"], "Understand and use proportion as equality of ratios."),
 "R8": ("Ratios, fractions and linear functions", "6", False, ["ratio"], "Relate ratios to fractions and to linear functions."),
 "R9": ("Percentages incl. reverse percentages", "4-5", False, ["percentage", "%", "original", "increase", "decrease", "interest"], "Percentages and percentage change, including increase/decrease, original value problems and simple interest in financial mathematics."),
 "R10": ("Direct and inverse proportion problems", "6", False, ["proportional", "proportion", "inversely", "directly"], "Solve problems involving direct and inverse proportion, including graphical and algebraic representations."),
 "R11": ("Compound units: speed, density, pressure", "4-5", False, ["speed", "density", "pressure", "km/h", "g/cm", "rate"], "Use compound units such as speed, rates of pay, unit pricing, density and pressure."),
 "R12": ("Comparing lengths, areas, volumes; similarity links", "7", False, ["similar", "scale factor"], "Compare lengths, areas and volumes using ratio notation; make links to similarity (including trigonometric ratios) and scale factors."),
 "R13": ("Proportion equations (y = kx, y = k/x²)", "7", False, ["proportional to", "inversely proportional", "directly proportional"], "Understand that X is inversely proportional to Y is equivalent to X is proportional to 1/Y; construct and interpret equations that describe direct and inverse proportion."),
 "R14": ("Gradient as rate of change; proportion graphs", "4-5", False, ["rate of change", "gradient"], "Interpret the gradient of a straight-line graph as a rate of change; recognise and interpret graphs that illustrate direct and inverse proportion."),
 "R15": ("Instantaneous and average rate of change", "8-9", True, ["tangent", "instantaneous", "average rate", "rate of change"], "Interpret the gradient at a point on a curve as the instantaneous rate of change; apply average and instantaneous rate of change in numerical, algebraic and graphical contexts."),
 "R16": ("Growth, decay, compound interest", "6", False, ["compound interest", "depreciat", "decay", "growth", "per annum", "each year"], "Set up, solve and interpret growth and decay problems, including compound interest, and work with general iterative processes."),
 "G1": ("Geometric notation and conventions", "4-5", False, [], "Use conventional terms and notations for points, lines, polygons and symmetry; label sides and angles of triangles; draw diagrams from written descriptions."),
 "G2": ("Constructions and loci", "4-5", False, ["construct", "compasses", "locus", "loci", "bisector", "ruler"], "Use the standard ruler and compass constructions; construct figures and solve loci problems."),
 "G3": ("Angle facts, parallel lines, polygons", "4-5", False, ["angle", "parallel", "interior", "exterior", "polygon"], "Angles at a point, on a straight line, vertically opposite, alternate and corresponding angles; angle sums in triangles and polygons; properties of regular polygons."),
 "G4": ("Properties of quadrilaterals and triangles", "4-5", False, ["parallelogram", "rhombus", "kite", "trapezium", "isosceles"], "Derive and apply properties of special quadrilaterals and triangles."),
 "G5": ("Congruence criteria (SSS, SAS, ASA, RHS)", "7", False, ["congruent"], "Use the basic congruence criteria for triangles (SSS, SAS, ASA, RHS)."),
 "G6": ("Geometric reasoning and proof", "7", False, ["prove", "give reasons", "show that"], "Apply angle facts, congruence, similarity and properties of quadrilaterals to derive results, including Pythagoras' theorem, and construct simple proofs."),
 "G7": ("Transformations incl. negative and fractional enlargement", "6", False, ["enlargement", "rotation", "reflection", "translation", "scale factor"], "Identify, describe and construct congruent and similar shapes by rotation, reflection, translation and enlargement (including fractional and negative scale factors)."),
 "G8": ("Combined transformations and invariance", "7", True, ["invariant", "followed by", "single transformation"], "Describe the changes and invariance achieved by combinations of rotations, reflections and translations."),
 "G9": ("Circle vocabulary", "4-5", False, ["chord", "sector", "segment", "arc", "circumference"], "Identify and apply circle definitions and properties: centre, radius, chord, diameter, circumference, tangent, arc, sector and segment."),
 "G10": ("Circle theorems", "7", True, ["circle theorem", "cyclic", "tangent", "alternate segment", "centre o", "semicircle"], "Apply and prove the standard circle theorems concerning angles, radii, tangents and chords."),
 "G11": ("Geometry problems on coordinate axes", "4-5", False, ["coordinates", "grid"], "Solve geometrical problems on coordinate axes."),
 "G12": ("Properties of 3D shapes", "4-5", False, ["faces", "edges", "vertices"], "Identify properties of faces, surfaces, edges and vertices of cubes, cuboids, prisms, cylinders, pyramids, cones and spheres."),
 "G13": ("Plans and elevations", "4-5", False, ["plan", "elevation"], "Construct and interpret plans and elevations of 3D shapes."),
 "G14": ("Units of measure", "4-5", False, [], "Use standard units of measure and related concepts."),
 "G15": ("Measuring, scale drawings, bearings", "4-5", False, ["bearing", "scale drawing", "measure"], "Measure line segments and angles, interpret maps and scale drawings, and use bearings."),
 "G16": ("Area and volume of 2D shapes and prisms", "4-5", False, ["area", "volume", "prism", "trapezium", "cuboid", "cylinder"], "Area of triangles, parallelograms, trapezia; volume of cuboids and other right prisms (including cylinders)."),
 "G17": ("Circles, spheres, cones, pyramids: area, surface area, volume", "6", False, ["sphere", "cone", "pyramid", "hemisphere", "surface area", "circle", "frustum"], "Perimeter and area of circles and composite shapes; surface area and volume of spheres, pyramids, cones and composite solids."),
 "G18": ("Arc length and sector area", "6", False, ["arc", "sector"], "Calculate arc lengths, angles and areas of sectors of circles."),
 "G19": ("Similarity: lengths, areas and volumes", "8-9", True, ["similar", "mathematically similar"], "Apply congruence and similarity, including the relationships between lengths, areas and volumes in similar figures."),
 "G20": ("Pythagoras and right-angled trig (incl. 3D)", "6", False, ["pythagoras", "sin", "cos", "tan", "right-angled", "hypotenuse"], "Pythagoras' theorem and the trigonometric ratios in right-angled triangles, in two and three dimensions."),
 "G21": ("Exact trig values", "6", False, ["exact value", "sin 30", "cos 60", "tan 45"], "Know the exact values of sin and cos for 0°, 30°, 45°, 60°, 90° and tan for 0°, 30°, 45°, 60°."),
 "G22": ("Sine rule and cosine rule", "7", True, ["sine rule", "cosine rule", "sin", "cos"], "Know and apply the sine rule and cosine rule to find unknown lengths and angles."),
 "G23": ("Area = ½ab sin C", "7", True, ["1/2 ab sin", "½ab sin", "area of triangle"], "Know and apply Area = ½ab sin C."),
 "G24": ("Vectors: translations and column vectors", "4-5", False, ["vector", "column vector"], "Describe translations as 2D vectors."),
 "G25": ("Vector arithmetic and vector proof", "8-9", False, ["vector", "\\overrightarrow", "collinear", "straight line", "parallel"], "Add and subtract vectors, multiply by a scalar; use vectors to construct geometric arguments and proofs."),
 "P1": ("Frequency trees and experimental outcomes", "4-5", False, ["frequency tree", "experiment"], "Record, describe and analyse outcomes of probability experiments using tables and frequency trees."),
 "P2": ("Expected outcomes", "4-5", False, ["expected", "how many times", "fair"], "Apply ideas of randomness, fairness and equally likely events to calculate expected outcomes."),
 "P3": ("Relative frequency and theoretical probability", "4-5", False, ["relative frequency", "probability scale"], "Relate relative expected frequencies to theoretical probability, using the 0–1 probability scale."),
 "P4": ("Probabilities sum to 1", "4-5", False, ["probability", "table"], "Probabilities of an exhaustive set of mutually exclusive outcomes sum to one."),
 "P5": ("Sample size and reliability", "4-5", False, ["more reliable", "sample size", "more trials"], "Understand that empirical unbiased samples tend towards theoretical distributions with increasing sample size."),
 "P6": ("Sets, Venn diagrams, systematic enumeration", "4-5", False, ["venn", "ξ", "∩", "∪", "set"], "Enumerate sets and combinations of sets systematically, using tables, grids, Venn diagrams and tree diagrams."),
 "P7": ("Sample spaces", "4-5", False, ["sample space", "two dice", "spinner"], "Construct theoretical possibility spaces for single and combined experiments with equally likely outcomes."),
 "P8": ("Combined events and tree diagrams (independent/dependent)", "6", False, ["tree diagram", "without replacement", "at random", "independent", "both"], "Calculate the probability of independent and dependent combined events, including using tree diagrams."),
 "P9": ("Conditional probability", "8-9", True, ["given that", "conditional"], "Calculate and interpret conditional probabilities using two-way tables, tree diagrams and Venn diagrams."),
 "S1": ("Sampling and populations", "4-5", False, ["sample", "population", "biased", "random sample"], "Infer properties of populations or distributions from a sample, knowing the limitations of sampling."),
 "S2": ("Charts, tables, time series, pie charts", "4-5", False, ["pie chart", "bar chart", "pictogram", "time series", "frequency table"], "Interpret and construct tables, charts and diagrams for categorical and discrete data, and line graphs for time series."),
 "S3": ("Histograms and cumulative frequency", "7", True, ["histogram", "cumulative frequency", "frequency density"], "Construct and interpret histograms with equal and unequal class intervals and cumulative frequency graphs."),
 "S4": ("Averages, spread, box plots, comparing distributions", "6", False, ["box plot", "median", "interquartile", "mean", "range", "quartile", "compare"], "Interpret and compare distributions using graphical representations including box plots, measures of central tendency and spread (range, quartiles and IQR)."),
 "S5": ("Using statistics to describe a population", "4-5", False, ["estimate", "population"], "Apply statistics to describe a population."),
 "S6": ("Scatter graphs and correlation", "4-5", False, ["scatter", "correlation", "line of best fit"], "Use and interpret scatter graphs; recognise correlation and that it does not indicate causation; lines of best fit; interpolate and extrapolate."),
}

def topics():
    out = []
    for code, (name, band, higher, kw, spec) in T.items():
        out.append({
            "code": code,
            "strand": STRANDS[code[0]],
            "name": name,
            "band": band,
            "higherOnly": higher,
            "keywords": kw,
            "spec": spec,
        })
    return out

if __name__ == "__main__":
    root = pathlib.Path(__file__).resolve().parent.parent
    data = {
        "spec": "AQA GCSE Mathematics (8300)",
        "note": "band = where Higher-tier questions on this topic usually sit (4-5, 6, 7, 8-9). Rough guide for ordering study, not an AQA classification.",
        "strands": STRANDS,
        "topics": topics(),
    }
    p = root / "app" / "data" / "topics.json"
    p.write_text(json.dumps(data, ensure_ascii=False, indent=1))
    print(f"wrote {p} ({len(data['topics'])} topics)")

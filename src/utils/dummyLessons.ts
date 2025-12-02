export const dummyLessons = [
  {
    title: "Introduction to HTML",
    description: "Learn the basics of HTML markup and structure",
    contentType: "text" as const,
    contentText: `HTML (HyperText Markup Language) is the standard markup language for creating web pages. It provides the structure and content of web documents.

## Key Concepts:
- HTML is used to structure web pages
- HTML elements are represented by tags
- Tags tell web browsers how to display content
- HTML is the foundation of web development

## Basic HTML Structure:
<!DOCTYPE html>
<html>
<head>
  <title>Page Title</title>
</head>
<body>
  <h1>This is a heading</h1>
  <p>This is a paragraph.</p>
</body>
</html>

## Common HTML Tags:
- <h1> to <h6>: Headings
- <p>: Paragraph
- <a>: Hyperlink
- <img>: Image
- <div>: Container
- <span>: Inline container`,
    duration: 45,
    saveForOffline: true
  },
  {
    title: "CSS Styling Fundamentals",
    description: "Master CSS for beautiful web design",
    contentType: "text" as const,
    contentText: `CSS (Cascading Style Sheets) is used to style and layout web pages. It allows you to control colors, fonts, spacing, and positioning.

## CSS Syntax:
selector {
  property: value;
}

## Key Concepts:
- Selectors: Target HTML elements
- Properties: What you want to change
- Values: How you want to change it

## Types of CSS:
1. Inline CSS: Applied directly to HTML elements
2. Internal CSS: Written in <style> tags
3. External CSS: Separate .css files

## Box Model:
- Content: The actual content
- Padding: Space inside the border
- Border: Line around padding
- Margin: Space outside the border

## Colors and Fonts:
- Colors can be specified in RGB, HEX, or named colors
- Common fonts: Arial, Helvetica, Times New Roman, Courier New`,
    duration: 50,
    saveForOffline: true
  },
  {
    title: "JavaScript Basics",
    description: "Introduction to JavaScript programming",
    contentType: "text" as const,
    contentText: `JavaScript is a programming language that runs in web browsers. It makes web pages interactive.

## Variables and Data Types:
- var, let, const: Declare variables
- String: Text data
- Number: Integer or decimal
- Boolean: true or false
- Array: Collection of values
- Object: Key-value pairs

## Control Structures:
if (condition) {
  // code runs if condition is true
} else {
  // code runs if condition is false
}

## Loops:
for (let i = 0; i < 5; i++) {
  console.log(i);
}

## Functions:
function greet(name) {
  return "Hello, " + name;
}

## DOM Manipulation:
- getElementById(): Get element by ID
- querySelector(): Get element by selector
- addEventListener(): Add event listeners
- innerHTML: Change content
- classList: Add/remove classes`,
    duration: 60,
    saveForOffline: true
  },
  {
    title: "Web Development Quiz",
    description: "Test your knowledge of HTML, CSS, and JavaScript",
    contentType: "quiz" as const,
    duration: 30,
    saveForOffline: true
  },
  {
    title: "Responsive Design Principles",
    description: "Create websites that work on all devices",
    contentType: "text" as const,
    contentText: `Responsive design ensures your website looks good on all screen sizes. This is essential in today's mobile-first world.

## Key Principles:
1. Fluid Layouts: Use percentages instead of fixed pixels
2. Flexible Media: Images and videos that scale
3. Media Queries: CSS rules for different screen sizes

## Mobile-First Approach:
- Design for mobile first
- Use media queries to add complexity for larger screens
- Start with min-width instead of max-width

## Common Breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Flexbox and Grid:
- Flexbox: One-dimensional layout
- Grid: Two-dimensional layout
- Both are powerful tools for responsive design

## Best Practices:
- Test on multiple devices
- Use logical units (em, rem)
- Optimize images for different resolutions
- Prioritize performance`,
    duration: 55,
    saveForOffline: true
  },
  {
    title: "Introduction to React",
    description: "Learn the basics of React framework",
    contentType: "text" as const,
    contentText: `React is a JavaScript library for building user interfaces with reusable components.

## Core Concepts:
- Components: Reusable pieces of UI
- JSX: JavaScript XML syntax
- State: Dynamic data in components
- Props: Pass data between components

## Functional Components:
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

## Hooks:
- useState: Manage component state
- useEffect: Handle side effects
- useContext: Share data between components
- useReducer: Complex state management

## State Management:
const [count, setCount] = useState(0);

function increment() {
  setCount(count + 1);
}

## Event Handling:
<button onClick={handleClick}>
  Click me
</button>

## Conditional Rendering:
{condition ? <ComponentA /> : <ComponentB />}

## Lists:
{items.map(item => <div key={item.id}>{item.name}</div>)}`,
    duration: 65,
    saveForOffline: true
  }
];

export const programmingLessonLessons = dummyLessons;

export const mathsLessons = [
  {
    title: "Algebra Fundamentals",
    description: "Master the basics of algebraic equations",
    contentType: "text" as const,
    contentText: `Algebra is the branch of mathematics that deals with variables and equations.

## Variables and Expressions:
- Variables: Unknown values represented by letters (x, y, z)
- Expressions: Combinations of variables, numbers, and operations
- Equations: Statements that two expressions are equal

## Solving Linear Equations:
3x + 5 = 20
3x = 15
x = 5

## Order of Operations (PEMDAS):
1. Parentheses
2. Exponents
3. Multiplication and Division (left to right)
4. Addition and Subtraction (left to right)

## Common Algebra Rules:
- Commutative: a + b = b + a
- Associative: (a + b) + c = a + (b + c)
- Distributive: a(b + c) = ab + ac
- Identity: a + 0 = a, a × 1 = a

## Practice Problems:
1. 2x + 3 = 11 (Solution: x = 4)
2. 5x - 2 = 18 (Solution: x = 4)
3. x/2 + 4 = 10 (Solution: x = 12)`,
    duration: 40,
    saveForOffline: true
  },
  {
    title: "Geometry Essentials",
    description: "Learn shapes, areas, and volumes",
    contentType: "text" as const,
    contentText: `Geometry studies shapes, sizes, and spatial relationships.

## Basic Shapes:
- Triangle: 3 sides, Area = (base × height) / 2
- Rectangle: 4 sides, Area = length × width
- Circle: Round shape, Area = πr²
- Square: Equal sides, Area = side²

## Perimeter and Area:
- Perimeter: Distance around a shape
- Area: Space inside a shape

## 3D Shapes:
- Cube: 6 square faces
- Sphere: Round in all directions
- Cylinder: Two circular bases

## Angles:
- Acute: Less than 90°
- Right: Exactly 90°
- Obtuse: Between 90° and 180°
- Straight: Exactly 180°

## Pythagorean Theorem:
a² + b² = c²
Used to find the length of sides in right triangles`,
    duration: 45,
    saveForOffline: true
  },
  {
    title: "Mathematics Quiz",
    description: "Test your math knowledge",
    contentType: "quiz" as const,
    duration: 30,
    saveForOffline: true
  }
];

export const scienceLessons = [
  {
    title: "Biology Basics",
    description: "Introduction to living organisms",
    contentType: "text" as const,
    contentText: `Biology is the study of living organisms and their relationships.

## Characteristics of Life:
- Organization: Cells are the basic unit
- Metabolism: Use energy
- Growth: Change in size
- Reproduction: Create offspring
- Response to Environment: React to surroundings
- Adaptation: Evolution over time

## Cell Structure:
- Nucleus: Controls cell activities
- Mitochondria: Produces energy (ATP)
- Chloroplast: Photosynthesis in plants
- Cell Membrane: Controls what enters/exits

## Evolution:
- Natural Selection: Survival of the fittest
- Adaptation: Traits that help survival
- Mutation: Changes in DNA
- Speciation: Formation of new species

## Classification:
Kingdom → Phylum → Class → Order → Family → Genus → Species

## Ecology:
- Ecosystem: Living and non-living things
- Food Chain: Energy transfer
- Habitat: Where organisms live
- Biodiversity: Variety of life`,
    duration: 50,
    saveForOffline: true
  },
  {
    title: "Chemistry Fundamentals",
    description: "Learn about atoms and reactions",
    contentType: "text" as const,
    contentText: `Chemistry studies matter and reactions between substances.

## Atomic Structure:
- Proton: Positive charge (nucleus)
- Neutron: No charge (nucleus)
- Electron: Negative charge (orbits nucleus)

## Elements and Compounds:
- Element: Pure substance (one type of atom)
- Compound: Two or more elements bonded
- Molecule: Atoms bonded together

## Chemical Reactions:
- Combustion: Burning
- Oxidation: Loss of electrons
- Reduction: Gain of electrons
- Synthesis: Combining substances

## Periodic Table:
- Groups: Vertical columns (similar properties)
- Periods: Horizontal rows (atomic number)
- Metals: Conduct electricity
- Non-metals: Do not conduct electricity
- Metalloids: Properties of both

## Chemical Bonding:
- Ionic: Transfer of electrons
- Covalent: Sharing of electrons
- Metallic: Electrons in a sea`,
    duration: 45,
    saveForOffline: true
  }
];

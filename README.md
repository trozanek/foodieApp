# React Restaurant Map

This project is a React application that displays a list of restaurants in Poland alongside a map. The map shows the user's location and markers for each restaurant. Users can select a restaurant from either the list or the map to view detailed information.

## Features

- Displays a list of restaurant locations on the left side.
- Shows a map on the right side, centered on the user's location.
- Markers on the map represent each restaurant.
- Fetches and displays restaurants based on the map's view.
- Highlights the selected restaurant in the list when selected from the map and vice versa.
- Displays detailed information about the selected restaurant.

## Project Structure

```
react-restaurant-map
├── public
│   └── index.html          # Main HTML file
├── src
│   ├── components
│   │   ├── LocationList.tsx  # Component for displaying the list of locations
│   │   ├── MapView.tsx       # Component for rendering the map
│   │   └── LocationDetails.tsx # Component for displaying details of a selected location
│   ├── data
│   │   └── restaurants-pl.json # JSON file containing restaurant data
│   ├── App.tsx               # Main application component
│   ├── index.tsx             # Entry point for the React application
│   └── types
│       └── index.ts          # TypeScript interfaces for restaurant data
├── package.json              # npm configuration file
├── tsconfig.json             # TypeScript configuration file
└── README.md                 # Project documentation
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd react-restaurant-map
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000` to view the application.

## Usage

- The left panel displays a list of restaurants. Click on any restaurant to view its details.
- The right panel shows a map with markers for each restaurant. Click on a marker to view details.
- The map will automatically center on the user's location and adjust to show restaurants within a 30 km radius.

## License

This project is licensed under the MIT License.
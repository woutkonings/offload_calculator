# LNG Offloading and Tank Calculation

## Overview
This project simulates the offloading of LNG from a trailer to a storage tank. It calculates the tank's final properties (pressure, temperature, mass, etc.) after offloading, based on thermodynamic data, and visualizes the process.

## Features
- Interactive sliders for tank and trailer parameters
- Real-time calculations of final tank state
- Visualization of liquid/gas levels before and after offloading
- Detailed calculation steps displayed

## Technologies Used
- HTML/CSS/JavaScript
- D3.js for visualization
- MathJax for equations

## Project Structure
- `index.html`: Main app file with sliders, calculations, and visualization
- D3.js: Tank and process visualizations
- MathJax: Displaying math formulas

## How to Run
1. Clone/download the project.
2. Open `index.html` in a browser.

## Sliders and Inputs
- **Tank Volume** (`V_tank`): 30 - 80 m³
- **Initial Liquid Level** (`Level_start`): 1% - 99%
- **Tank Pressure** (`P_start`): 1 - 11 bar
- **Trailer Pressure** (`P_trailer`): 0.5 - 10 bar
- **Offloaded Mass** (`m_offload`): Mass of LNG offloaded

## Calculations
- Interpolates thermodynamic properties using pressure and mass.
- Computes final state: total mass, liquid/gas volumes, pressure, and temperature.

## Visualization
D3.js shows tank liquid and gas levels before and after offloading.



## Explanation of State Equations

To calculate the new state of the tank after LNG offloading, the following thermodynamic relations and state equations are used:

### 1. Mass Balance Equation
The total mass in the tank after offloading is the sum of the initial mass in the tank and the offloaded mass:

\[
m_{\text{total}}^{\text{final}} = m_{\text{total}}^{\text{start}} + m_{\text{offload}}
\]

### 2. Energy Balance Equation
The internal energy of the system is updated by adding the internal energy of the offloaded LNG to the initial energy of the tank:

\[
U_{\text{total}}^{\text{final}} = U_{\text{total}}^{\text{start}} + (m_{\text{offload}} \cdot h_{\text{liquid}}^{\text{trailer}})
\]

Where:
- \( h_{\text{liquid}}^{\text{trailer}} \) is the specific enthalpy of the liquid in the trailer.
  
### 3. Specific Internal Energy and Volume
The average specific internal energy and specific volume of the tank after offloading are calculated as:

\[
u_{\text{final}} = \frac{U_{\text{total}}^{\text{final}}}{m_{\text{total}}^{\text{final}}}
\]
\[
v_{\text{final}} = \frac{V_{\text{tank}}}{m_{\text{total}}^{\text{final}}}
\]

Where:
- \( V_{\text{tank}} \) is the volume of the tank.
  
### 4. Pressure Estimation
The final tank pressure \( P_{\text{final}} \) is determined by iterating through thermodynamic tables and interpolating the properties of methane at different pressures. The algorithm adjusts the pressure until the specific volume and specific internal energy match the interpolated values for a new equilibrium state.

### 5. Liquid-Gas Quality
The liquid-gas ratio (quality) \( x \) is determined using specific volumes:

\[
x = \frac{v_{\text{final}} - v_{\text{liquid}}}{v_{\text{gas}} - v_{\text{liquid}}}
\]

Where:
- \( v_{\text{liquid}} \) and \( v_{\text{gas}} \) are the specific volumes of liquid and gas phases, respectively.

---

By using these equations, the program calculates the final pressure, temperature, liquid level, and mass distribution within the tank after offloading.
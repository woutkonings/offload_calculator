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

The state of the tank is calculated after offloading using thermodynamic equations, specifically focusing on mass and energy balance. 

### 1. Mass Balance Equation
The total mass in the tank after offloading is the sum of the initial mass in the tank and the offloaded mass:

$$
m_{\text{total}}^{\text{final}} = m_{\text{total}}^{\text{start}} + m_{\text{offload}}
$$

Where:
- \( m_{\text{total}}^{\text{final}} \) is the total mass in the tank after offloading.
- \( m_{\text{total}}^{\text{start}} \) is the initial mass in the tank.
- \( m_{\text{offload}} \) is the mass of LNG transferred from the trailer.

### 2. Energy Balance Equation
The internal energy of the system is updated by adding the energy associated with the offloaded LNG:

$$
U_{\text{total}}^{\text{final}} = U_{\text{total}}^{\text{start}} + (m_{\text{offload}} \cdot h_{\text{liquid}}^{\text{trailer}})
$$

Where:
- \( U_{\text{total}}^{\text{final}} \) is the total internal energy in the tank after offloading.
- \( h_{\text{liquid}}^{\text{trailer}} \) is the specific enthalpy of the liquid from the trailer.

### 3. Specific Internal Energy and Volume
After offloading, the average specific internal energy and specific volume of the tank are calculated as follows:

$$
u_{\text{final}} = \frac{U_{\text{total}}^{\text{final}}}{m_{\text{total}}^{\text{final}}}
$$

$$
v_{\text{final}} = \frac{V_{\text{tank}}}{m_{\text{total}}^{\text{final}}}
$$

Where:
- \( u_{\text{final}} \) is the specific internal energy after offloading.
- \( v_{\text{final}} \) is the specific volume after offloading.

### 4. Pressure Estimation
The final tank pressure \( P_{\text{final}} \) is determined by iterating through thermodynamic tables to find the pressure that corresponds to the calculated specific internal energy and volume:

$$
P_{\text{final}} = f(v_{\text{final}}, u_{\text{final}})
$$

### 5. Liquid-Gas Quality
The liquid-gas ratio (quality) \( x \) is determined by the following equation using the specific volumes of the liquid and gas:

$$
x = \frac{v_{\text{final}} - v_{\text{liquid}}}{v_{\text{gas}} - v_{\text{liquid}}}
$$

Where:
- \( v_{\text{liquid}} \) is the specific volume of the liquid phase.
- \( v_{\text{gas}} \) is the specific volume of the gas phase.

---

By using these equations, the program calculates the final pressure, temperature, liquid level, and mass distribution within the tank after offloading.
const defaultValues = {
    'V_tank': 65,
    'Level_start': 0.5,
    'P_start': 8,
    'P_trailer': 1.5,
    'm_offload': 4000
};

window.onload = function() {
    for(let id in defaultValues) {
        let slider = document.getElementById(id);
        slider.value = defaultValues[id];
        updateValue(id);
    }
    calculate();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateValue(id) {
    let slider = document.getElementById(id);
    let display = document.getElementById(id + '_display');
    if (id === "Level_start") {
        display.textContent = (slider.value * 100).toFixed(0);
    } else{
        display.textContent = slider.value;
    }
}

//according to table https://www.engineersedge.com/thermodynamics/saturated_methane_thermodynamic_properties_table_14808.htm
// and https://www.engineersedge.com/thermodynamics/methane_thermodynamic_properties_table_14809.htm
const pressures = [11.7, 19.8, 34.4, 56.4, 88.2, 101.3, 132.3, 191.6, 269.0, 367.6, 490.7, 641.6, 823.7, 1040.5, 1295.6, 1592.8, 1935.9, 2329.3, 2777.6, 3286.4, 3863.2, 4520.5, 4599.2];
const temperatures = [90.7, 95, 100, 105, 110, 111.7, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 190.6];
const liquidSpecificVolumes = [0.002215, 0.002243, 0.002278, 0.002315, 0.002353, 0.002367, 0.002395, 0.002439, 0.002486, 0.002537, 0.002592, 0.002653, 0.002719, 0.002794, 0.002877, 0.002974, 0.003086, 0.003222, 0.003393, 0.003623, 0.003977, 0.004968, 0.006148];
const gasSpecificVolumes = [3.98163, 2.45069, 1.47885, 0.94012, 0.62443, 0.54997, 0.43040, 0.30610, 0.22357, 0.16701, 0.12717, 0.09841, 0.07717, 0.06118, 0.04892, 0.03936, 0.03177, 0.02563, 0.02058, 0.01629, 0.01243, 0.00797, 0.00615];
const liquidInternalEnergies = [-358.10, -343.79, -326.90, -309.79, -292.50, -286.74, -275.05, -257.45, -239.66, -221.65, -203.40, -184.86, -165.97, -146.65, -126.82, -106.35, -85.06, -62.67, -38.75, -12.43, 18.47, 69.10, 101.46];
const gasInternalEnergies = [138.49, 144.83, 152.06, 159.11, 165.91, 168.10, 172.42, 178.57, 184.32, 189.60, 194.37, 198.56, 202.09, 204.88, 206.79, 207.66, 207.24, 205.14, 200.72, 192.73, 177.96, 136.11, 101.46];
const liquidEnthalpy = [-358.07, -343.75, -326.83, -309.66, -292.29, -286.50, -274.74, -256.98, -238.99, -220.72, -202.13, -183.16, -163.73, -143.74, -123.09, -101.61, -79.08, -55.17, -29.33, -0.53, 33.83, 91.56, 129.74];
const gasEnthalpy = [185.05, 193.43, 202.94, 212.16, 221.00, 223.83, 229.38, 237.23, 244.45, 251.00, 256.77, 261.69, 265.66, 268.54, 270.18, 270.35, 268.74, 264.85, 257.87, 246.25, 226.00, 172.14, 129.74];

function interpolate(pressureArray, propertyArray, inputPressure) {

    inputPressure = inputPressure * 100 //convert from bar to kPa as is in table

    for (let i = 0; i < pressureArray.length - 1; i++) {
        if (pressureArray[i] <= inputPressure && pressureArray[i + 1] >= inputPressure) {
            let P1 = pressureArray[i];
            let P2 = pressureArray[i + 1];
            let prop1 = propertyArray[i];
            let prop2 = propertyArray[i + 1];
            return prop1 + (prop2 - prop1) * (inputPressure - P1) / (P2 - P1);
        }
    }
    throw new Error("Pressure outside of table range");
}

function findProperties(inputPressure) {
    let estimatedTemperature = interpolate(pressures, temperatures, inputPressure); //K
    let estimatedLiquidSpecificVolume = interpolate(pressures, liquidSpecificVolumes, inputPressure); //m3 / kg
    let estimatedGasSpecificVolume = interpolate(pressures, gasSpecificVolumes, inputPressure); // m3 / kg
    let estimatedLiquidInternalEnergy = interpolate(pressures, liquidInternalEnergies, inputPressure); // kJ/kg
    let estimatedGasInternalEnergy = interpolate(pressures, gasInternalEnergies, inputPressure); // kJ / kg
    let estimatedLiquidEnthalpy = interpolate(pressures, liquidEnthalpy, inputPressure); // kJ / kg
    let estimatedGasEnthalpy = interpolate(pressures, gasEnthalpy, inputPressure); // kJ / kg

    return {
        temperature: estimatedTemperature,
        liquidSpecificVolume: estimatedLiquidSpecificVolume,
        gasSpecificVolume: estimatedGasSpecificVolume,
        liquidInternalEnergy: estimatedLiquidInternalEnergy,
        gasInternalEnergy: estimatedGasInternalEnergy,
        liquidEnthalpy: estimatedLiquidEnthalpy,
        gasEnthalpy: estimatedGasEnthalpy
    };
}

function derivePressure(v, u, tolerance = 0.05, maxIterations = 1000) {
        let P_low = 0.5;  // Start with the smallest pressure
        let P_high = 12; // End with the highest pressure

        let iteration = 0;

        while (iteration < maxIterations) {
            const P_mid = (P_low + P_high) / 2;

            const propertiesLow = findProperties(P_low);
            const propertiesMid = findProperties(P_mid);

            const x_v_low = (v - propertiesLow.liquidSpecificVolume) / (propertiesLow.gasSpecificVolume - propertiesLow.liquidSpecificVolume);
            const x_u_low = (u - propertiesLow.liquidInternalEnergy) / (propertiesLow.gasInternalEnergy - propertiesLow.liquidInternalEnergy);
            const x_v_mid = (v - propertiesMid.liquidSpecificVolume) / (propertiesMid.gasSpecificVolume - propertiesMid.liquidSpecificVolume);
            const x_u_mid = (u - propertiesMid.liquidInternalEnergy) / (propertiesMid.gasInternalEnergy - propertiesMid.liquidInternalEnergy);
            // Check if the root lies in the lower half or the upper half
            if ((x_v_low - x_u_low) * (x_v_mid - x_u_mid) < 0) {
                P_high = P_mid;
            } else {
                P_low = P_mid;
            }
            console.log("P_mid = " + P_mid)
            // Check for convergence
            if (Math.abs(P_high - P_low) < tolerance) {
                return P_mid;
            }

            iteration++;
        }

        throw new Error("Failed to converge after maximum iterations");
    }

    function calculateTankProperties(V_tank, derivedPressure, totalMass) {
        const properties = findProperties(derivedPressure);
        // Calculate quality based on specific volume
        const x = (V_tank / totalMass - properties.liquidSpecificVolume) / (properties.gasSpecificVolume - properties.liquidSpecificVolume);
        // Calculate liquid and gas mass
        const liquidMass = (1 - x) * totalMass;
        const gasMass = x * totalMass;
        // Calculate liquid and gas volumes
        const Vliquid = liquidMass * properties.liquidSpecificVolume;
        const Vgas = gasMass * properties.gasSpecificVolume;
        const liquidLevel = Vliquid / V_tank;
        return {
            totalMass: totalMass,
            liquidMass: liquidMass,
            gasMass: gasMass,
            Vliquid: Vliquid,
            Vgas: Vgas,
            temperature: properties.temperature,
            liquidLevel: liquidLevel
        };
    }



async function calculate() {

    
    const V_tank = parseFloat(document.getElementById("V_tank").value);
    const LiquidLevel_start = parseFloat(document.getElementById("Level_start").value);
    const P_tank_start = parseFloat(document.getElementById("P_start").value);
    const gasLevel_start = 1 - LiquidLevel_start
   
    // set approximate value for m_offload slider
    document.getElementById("m_offload").max = (1 - LiquidLevel_start) * 23000
    slider = document.getElementById('m_offload')
    parentWidth = slider.parentElement.offsetWidth
    newWidth = parentWidth * (1 - LiquidLevel_start)
    slider.style.width = `${newWidth}px`;
   

    document.getElementById("steps").innerHTML = "";
    document.getElementById("steps").innerHTML += `Start values are: <br>`;
    document.getElementById("steps").innerHTML += `\\(V_{tank}\\) = ${V_tank.toFixed(2)} \\(m^3\\) <br>`;
    document.getElementById("steps").innerHTML += `\\(LiquidLevel_{start}\\) = ${(LiquidLevel_start * 100).toFixed(2)}%<br>`;
    document.getElementById("steps").innerHTML += `\\(P_{tank}^{start}\\) = ${P_tank_start.toFixed(2)} bar<br>`;

    const V_liquid_start = V_tank * LiquidLevel_start
    document.getElementById("steps").innerHTML += `\\(V_{liquid}^{start}\\) = ${V_liquid_start.toFixed(2)} \\(m^3\\)<br>`;
    const V_gas_start = V_tank * gasLevel_start
    document.getElementById("steps").innerHTML += `\\(V_{gas}^{start}\\) = ${V_gas_start.toFixed(2)} \\(m^3\\)<br>`;

    document.getElementById("steps").innerHTML += `Then we have according to the thermodynamic property tables: <br>`;
    start_estimations = findProperties(P_tank_start)
    T_start = start_estimations['temperature']
    document.getElementById("steps").innerHTML += `\\(T_{tank}^{start}\\) = ${T_start.toFixed(2)} \\(K\\) / ${(T_start - 272.15).toFixed(2)} \\(C\\)<br>`;
    LiqSpecVol_start = start_estimations['liquidSpecificVolume']
    LiqDensity_start = 1 / LiqSpecVol_start
    document.getElementById("steps").innerHTML += `\\(v_{liquid}^{start}\\) = ${LiqSpecVol_start.toFixed(5)} \\(m^3/kg\\) --> \\(\\rho_{liquid}^{start}\\) = ${LiqDensity_start.toFixed(2)} \\(kg/m^3\\)<br>`;
    GasSpecVol_start = start_estimations['gasSpecificVolume']
    GasDensity_start = 1 / GasSpecVol_start
    document.getElementById("steps").innerHTML += `\\(v_{gas}^{start}\\) = ${GasSpecVol_start.toFixed(5)} \\(m^3/kg\\) --> \\(\\rho_{gas}^{start}\\) = ${GasDensity_start.toFixed(2)} \\(kg/m^3\\)<br>`;
    LiquidInternalEnergy = start_estimations['liquidInternalEnergy']
    document.getElementById("steps").innerHTML += `\\(u_{liquid}^{start}\\) = ${LiquidInternalEnergy.toFixed(2)} \\(kJ/kg\\) <br>`;
    GasInternalEnergy = start_estimations['gasInternalEnergy']
    document.getElementById("steps").innerHTML += `\\(u_{gas}^{start}\\) = ${GasInternalEnergy.toFixed(2)} \\(kJ/kg\\) <br>`;

    document.getElementById("steps").innerHTML += `(absolute enthalpy/internal energy values are meaningless, difference matters): <br>`;


    document.getElementById("steps").innerHTML += `Given this we can calculate the mass of the liquid and the gas and the total mass in the tank: <br>`;
    mass_gas_start = V_gas_start * GasDensity_start
    mass_liquid_start = V_liquid_start * LiqDensity_start
    m_total_tank = mass_gas_start + mass_liquid_start
    document.getElementById("steps").innerHTML += `\\(m_{gas}^{start}\\) = \\(V_{gas}^{start} \\cdot \\rho_{gas}^{start}\\) = ${mass_gas_start.toFixed(2)} \\(kg\\) <br>`;
    document.getElementById("steps").innerHTML += `\\(m_{liquid}^{start}\\) = \\(V_{liquid}^{start} \\cdot \\rho_{liquid}^{start}\\) = ${mass_liquid_start.toFixed(2)} \\(kg\\) <br>`;
    document.getElementById("steps").innerHTML += `\\(m_{total}^{start}\\) = ${m_total_tank.toFixed(2)} \\(kg\\) <br>`;

    document.getElementById("steps").innerHTML += `Given this we can calculate the internal of the liquid and the gas and the total energy in the tank: <br>`;

    u_gas_start = mass_gas_start * GasInternalEnergy
    u_liquid_start = mass_liquid_start * LiquidInternalEnergy
    u_tank_start = u_gas_start + u_liquid_start
    document.getElementById("steps").innerHTML += `\\(U_{gas}^{start}\\) = \\(m_{gas}^{start} \\cdot u_{gas}^{start}\\) = ${u_gas_start.toFixed(2)} \\(kJ\\) <br>`;
    document.getElementById("steps").innerHTML += `\\(U_{liquid}^{start}\\) = \\(m_{liquid}^{start} \\cdot u_{liquid}^{start}\\) = ${u_liquid_start.toFixed(2)} \\(kJ\\) <br>`;
    document.getElementById("steps").innerHTML += `\\(U_{total}^{start}\\) = ${u_tank_start.toFixed(2)} \\(kJ\\) <br>`;


    document.getElementById("steps").innerHTML += `<br> <br> <br>`;
    document.getElementById("steps").innerHTML += `Now we move to the trailer. From this we know: <br>`;
    const P_trailer = parseFloat(document.getElementById("P_trailer").value);
    const m_offload = parseFloat(document.getElementById("m_offload").value);

    document.getElementById("steps").innerHTML += `\\(P_{trailer}\\) = ${P_trailer.toFixed(2)} bar<br>`;

    document.getElementById("steps").innerHTML += `and we can get from the tables (only interested in the liquid component): <br>`;

    start_estimations_trailer = findProperties(P_trailer)
    T_trailer = start_estimations_trailer['temperature']
    document.getElementById("steps").innerHTML += `\\(T_{tank}^{trailer}\\) = ${T_trailer.toFixed(2)} \\(K\\) / ${(T_trailer - 272.15).toFixed(2)} \\(C\\)<br>`;
    LiqSpecVol_trailer = start_estimations_trailer['liquidSpecificVolume']
    LiqDensity_trailer = 1 / LiqSpecVol_trailer
    document.getElementById("steps").innerHTML += `\\(v_{liquid}^{trailer}\\) = ${LiqSpecVol_trailer.toFixed(2)} \\(m^3/kg\\) --> \\(\\rho_{liquid}^{trailer}\\) = ${LiqDensity_trailer.toFixed(2)} \\(kg/m^3\\)<br>`;
    LiquidEnthalpy_trailer = start_estimations_trailer['liquidEnthalpy']
    document.getElementById("steps").innerHTML += `\\(h_{liquid}^{trailer}\\) = ${LiquidEnthalpy_trailer.toFixed(2)} \\(kJ/kg\\) <br>`;

    document.getElementById("steps").innerHTML += `<br><br>`;
    document.getElementById("steps").innerHTML += `Now we will offload \\(m_{liquid}^{offload}\\) = ${m_offload.toFixed(2)} \\(kg\\)<br>`;
    U_offload = m_offload * LiquidEnthalpy_trailer
    document.getElementById("steps").innerHTML += `which has energy \\(H_{offload}^{} = m_{liquid}^{offload} \\cdot h_{liquid}^{trailer}\\) = ${U_offload.toFixed(2)} \\(kJ\\)<br>`;



    document.getElementById("steps").innerHTML += `<br><br>`;
    document.getElementById("steps").innerHTML += `Then we have finally in the tank: <br>`;

    m_tank_final = m_offload + m_total_tank
    U_tank_final = U_offload + u_tank_start

    document.getElementById("steps").innerHTML += `which has energy \\(U_{total}^{final} = U_{offload}^{} + U_{total}^{start}\\) = ${U_tank_final.toFixed(2)} \\(kJ\\)<br>`;
    document.getElementById("steps").innerHTML += `and total mass \\(m_{total}^{final} = m_{offload}^{} + m_{total}^{start}\\) = ${m_tank_final.toFixed(2)} \\(kg\\)<br>`;

    document.getElementById("steps").innerHTML += `which means we have for the thermodynamic tables: <br>`;
    u_final = U_tank_final / m_tank_final
    v_final = V_tank / m_tank_final
    document.getElementById("steps").innerHTML += `average specific internal energy \\(u_{total}^{final}\\) = ${u_final.toFixed(2)} \\(kJ / kg\\)<br>`;
    document.getElementById("steps").innerHTML += `average specific volume \\(v_{total}^{final}\\) = ${v_final.toFixed(5)} \\(m^3 / kg\\)<br>`;
    
    let P_final = 4
    try {
        P_final = derivePressure(v_final, u_final);
        console.log(`Derived Pressure: ${P_final} bar`);
    } catch (error) {
        console.error(error.message);
    }

    console.log("P_final = " + P_final)
    document.getElementById("steps").innerHTML += `This gives final pressure \\(P_{tank}^{final}\\) = ${P_final.toFixed(2)} \\(bar\\)<br>`;
    
    finalTankProperties = calculateTankProperties(V_tank, P_final, m_tank_final);
    document.getElementById("steps").innerHTML += `Total mass \\(m_{tank}^{final}\\) = ${finalTankProperties.totalMass.toFixed(2)} \\(kg\\)<br>`;
    document.getElementById("steps").innerHTML += `Total liquid mass \\(m_{liquid}^{final}\\) = ${finalTankProperties.liquidMass.toFixed(2)} \\(kg\\)<br>`;
    document.getElementById("steps").innerHTML += `Total gas mass \\(m_{gas}^{final}\\) = ${finalTankProperties.gasMass.toFixed(2)} \\(kg\\)<br>`;
    document.getElementById("steps").innerHTML += `Final temperature \\(T_{tank}^{final}\\) = ${finalTankProperties.temperature.toFixed(2)} \\(K\\) / ${(finalTankProperties.temperature - 272.15).toFixed(2)} \\(C\\)<br>`;
    document.getElementById("steps").innerHTML += `Total liquid volume \\(V_{liquid}^{final}\\) = ${finalTankProperties.Vliquid.toFixed(2)} \\(m^3\\)<br>`;
    document.getElementById("steps").innerHTML += `Total gas volume \\(V_{gas}^{final}\\) = ${finalTankProperties.Vgas.toFixed(2)} \\(m^3\\)<br>`;
    document.getElementById("steps").innerHTML += `Final liquid level \\(LL_{tank}^{final}\\) = ${finalTankProperties.liquidLevel.toFixed(2)} \\(%\\)<br>`;
    
    
    MathJax.typesetPromise();

    document.getElementById("display-P_final").textContent = P_final.toFixed(2) + ' bar'
    document.getElementById("display-totalMass").textContent = finalTankProperties.totalMass.toFixed(0) + ' kg'
    document.getElementById("display-liquidMass").textContent = finalTankProperties.liquidMass.toFixed(0) + ' kg'
    document.getElementById("display-gasMass").textContent = finalTankProperties.gasMass.toFixed(0) + ' kg'
    document.getElementById("display-temp").textContent = (finalTankProperties.temperature - 272.15).toFixed(1) + ' C'
    document.getElementById("display-liquidlevel").textContent = (finalTankProperties.liquidLevel* 100).toFixed(0) + '%'



    //Visualization

    document.getElementById('visualization').innerHTML = ''

    let containerWidth = document.getElementById('visualization').offsetWidth;
    
    const width = containerWidth, height = 600;
    
    const svg = d3.select("#visualization").append("svg")
    .attr("width", width)
    .attr("height", height);

    const tankHeight = 300
    const tankWidth = 150;
    posXtankStart = 0.05 * width;
    posYtankStart = 100;

    drawTank(  svg, 
            posXtankStart, 
            posYtankStart, 
            tankHeight, 
            tankWidth, 
            LiquidLevel_start,
            mass_liquid_start,
            mass_gas_start,
            T_start,
            P_tank_start,
            "Tank Before Offload");

    drawOffloadArrow(svg, width, height, m_offload, T_trailer)

    // Final state of the tank
    posXtankEnd = 0.7 * width;
    posYtankEnd = 100;
    drawTank(  svg, 
                posXtankEnd, 
                posYtankEnd, 
                tankHeight, 
                tankWidth, 
                finalTankProperties.liquidLevel,
                finalTankProperties.liquidMass,
                finalTankProperties.gasMass,
                finalTankProperties.temperature,
                P_final,
                "Tank After Offload");


    MathJax.typesetPromise();
    
}

function drawOffloadArrow(svg, width, height, m_offload, temp_offload) {

    // Define the arrow's path
    const arrowPath = `
        M ${width/2 - 40} ${height/2}
        L ${width/2 + 40} ${height/2}
        M ${width/2 + 35} ${height/2 - 5}
        L ${width/2 + 40} ${height/2}
        L ${width/2 + 35} ${height/2 + 5}
    `;

    // Add the arrow to the SVG
    svg.append('path')
    .attr('d', arrowPath)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', '2');

    // Display the attributes of the offloaded liquid next to the arrow
    const offloadAttributes = [
        `Mass = ${m_offload.toFixed(0)} kg`,
        `Temp. = ${(temp_offload - 273.15).toFixed(1)} C`
    ];

    offloadAttributes.forEach((attribute, idx) => {
        svg.append('text')
        .attr('x', width/2 - 40)
        .attr('y', height/2 - 50 + idx * 20)
        .attr('font-size', '14px')
        .text(attribute);
    });
}


function drawTank(svg, 
xPosition, 
yPosition,
tankHeight, 
tankWidth, 
liquidLevel,
mass_liquid,
mass_gas,
temp,
pressure,
label) {

    // Draw tank
    svg.append("rect")
        .attr("x", xPosition)
        .attr("y", yPosition)
        .attr("width", tankWidth)
        .attr("height", tankHeight)
        .style("fill", "none")
        .style("stroke", "black");

    // Draw liquid
    const liquidHeight = tankHeight * liquidLevel;
    svg.append("rect")
        .attr("x", xPosition)
        .attr("y", yPosition + (tankHeight - liquidHeight))
        .attr("width", tankWidth)
        .attr("height", liquidHeight)
        .style("fill", "rgb(173, 216, 230)");

    // Add label
    svg.append("text")
        .attr("x", xPosition + tankWidth / 2)
        .attr("y", yPosition + tankHeight - liquidHeight / 2)
        .style("text-anchor", "middle")
        .text(mass_liquid.toFixed(0) + ' kg. ' + (temp - 272.15).toFixed(0) + ' C');
    
    svg.append("text")
        .attr("x", xPosition + tankWidth / 2)
        .attr("y", yPosition + (tankHeight - liquidHeight) / 2)
        .style("text-anchor", "middle")
        .text(mass_gas.toFixed(0) + ' kg. ' + pressure.toFixed(2) + ' bar');

    svg.append("text")
        .attr("x", xPosition + tankWidth / 2)
        .attr("y", yPosition + tankHeight + 20)
        .style("text-anchor", "middle")
        .text(label);
}
// =============== GYM DIET LOGIC ===============
const gymButton = document.getElementById('generateGymDiet');
const gymResult = document.getElementById('gymResult');
const gymTable = document.getElementById('gymMealTable');

// ...existing code...
// Meal Database
const mealPlans = {
  gain: {
    breakfast: [
      { name: "Oats + Eggs + Banana", calories: 450, protein: 30, carbs: 55, fats: 12 },
      { name: "Protein Smoothie + Toast", calories: 480, protein: 35, carbs: 52, fats: 14 },
      { name: "Paneer Paratha + Yogurt", calories: 460, protein: 28, carbs: 58, fats: 15 }
    ],
    lunch: [
      { name: "Chicken + Brown Rice", calories: 650, protein: 45, carbs: 75, fats: 20 },
      { name: "Fish Curry + Rice + Dal", calories: 630, protein: 42, carbs: 78, fats: 18 },
      { name: "Mutton Biryani + Raita", calories: 680, protein: 48, carbs: 72, fats: 22 }
    ],
    dinner: [
      { name: "Paneer + Roti + Veggies", calories: 550, protein: 35, carbs: 45, fats: 18 },
      { name: "Grilled Chicken + Salad", calories: 520, protein: 38, carbs: 42, fats: 16 },
      { name: "Egg Curry + Roti", calories: 540, protein: 36, carbs: 44, fats: 19 }
    ]
  },
  lose: {
    breakfast: [
      { name: "Omelette + Toast", calories: 300, protein: 25, carbs: 30, fats: 8 },
      { name: "Greek Yogurt + Fruits", calories: 280, protein: 22, carbs: 32, fats: 7 },
      { name: "Vegetable Poha", calories: 290, protein: 20, carbs: 35, fats: 6 }
    ],
    lunch: [
      { name: "Grilled Fish + Salad", calories: 400, protein: 35, carbs: 35, fats: 10 },
      { name: "Chickpea Curry + Rice", calories: 380, protein: 32, carbs: 38, fats: 9 },
      { name: "Quinoa Bowl + Tofu", calories: 390, protein: 33, carbs: 36, fats: 11 }
    ],
    dinner: [
      { name: "Clear Soup + Veggies", calories: 350, protein: 25, carbs: 25, fats: 10 },
      { name: "Grilled Chicken + Salad", calories: 340, protein: 28, carbs: 22, fats: 12 },
      { name: "Lentil Soup + Roti", calories: 330, protein: 24, carbs: 26, fats: 9 }
    ]
  }
};
gymButton.addEventListener('click', () => {
  const goal = document.getElementById('gym-goal').value;
  
  // Get random meals for the goal
  const meals = mealPlans[goal];
  const breakfast = meals.breakfast[Math.floor(Math.random() * meals.breakfast.length)];
  const lunch = meals.lunch[Math.floor(Math.random() * meals.lunch.length)];
  const dinner = meals.dinner[Math.floor(Math.random() * meals.dinner.length)];

  // Calculate totals
  const totalCals = breakfast.calories + lunch.calories + dinner.calories;
  const totalProtein = breakfast.protein + lunch.protein + dinner.protein;
  const totalCarbs = breakfast.carbs + lunch.carbs + dinner.carbs;
  const totalFats = breakfast.fats + lunch.fats + dinner.fats;

  // Generate table with meals and totals
  gymTable.innerHTML = `
    <tr>
      <th>Meal</th>
      <th>Calories</th>
      <th>Protein(g)</th>
      <th>Carbs(g)</th>
      <th>Fats(g)</th>
    </tr>
    <tr>
      <td>${breakfast.name}</td>
      <td>${breakfast.calories}</td>
      <td>${breakfast.protein}</td>
      <td>${breakfast.carbs}</td>
      <td>${breakfast.fats}</td>
    </tr>
    <tr>
      <td>${lunch.name}</td>
      <td>${lunch.calories}</td>
      <td>${lunch.protein}</td>
      <td>${lunch.carbs}</td>
      <td>${lunch.fats}</td>
    </tr>
    <tr>
      <td>${dinner.name}</td>
      <td>${dinner.calories}</td>
      <td>${dinner.protein}</td>
      <td>${dinner.carbs}</td>
      <td>${dinner.fats}</td>
    </tr>
    <tr class="totals">
      <td><strong>Daily Totals</strong></td>
      <td><strong>${totalCals}</strong></td>
      <td><strong>${totalProtein}</strong></td>
      <td><strong>${totalCarbs}</strong></td>
      <td><strong>${totalFats}</strong></td>
    </tr>
  `;

  // Add recommendations
  const recommendations = document.createElement('div');
  recommendations.className = 'recommendations';
  recommendations.innerHTML = `
    <h3>Daily Recommendations:</h3>
    <ul>
      <li>Drink 3-4 liters of water</li>
      <li>Take meals every 3-4 hours</li>
      <li>${goal === 'gain' ? 'Add protein shake post workout' : 'Avoid sugary drinks'}</li>
      <li>Get 7-8 hours of sleep</li>
    </ul>
  `;

  gymResult.innerHTML = '';
  gymResult.appendChild(gymTable);
  gymResult.appendChild(recommendations);
  gymResult.classList.remove('hidden');
});

  // =============== PERSONALIZED DIET LOGIC ===============
  const calcBtn = document.getElementById('calculateBtn');
  const resultDiv = document.getElementById('result');
  const caloriesSpan = document.getElementById('calories');
  const mealTable = document.getElementById('mealTable');

  function calculateBMR({age,gender,weight,height}){
    // Mifflin-St Jeor
    if (gender === 'male') return Math.round(10*weight + 6.25*height - 5*age + 5);
    return Math.round(10*weight + 6.25*height - 5*age - 161);
  }

  function calculateTDEE(bmr, activityFactor){
    return Math.round(bmr * activityFactor);
  }

  // flatten meal options from mealPlans
  function getAllMeals(){
    const keys = Object.keys(mealPlans);
    let arr = [];
    keys.forEach(k=>{
      const m = mealPlans[k];
      ['breakfast','lunch','dinner'].forEach(slot=>{
        (m[slot]||[]).forEach(it=> arr.push({ ...it, slot }));
      });
    });
    return arr;
  }

  function pickMealsForCalories(totalCalories){
    const perMeal = totalCalories/3;
    const all = getAllMeals();
    const chosen = [];
    // choose breakfast, lunch, dinner by finding closest for each slot
    ['breakfast','lunch','dinner'].forEach(slot=>{
      const candidates = all.filter(m=>m.slot===slot);
      let best = candidates.reduce((prev,curr)=> Math.abs(curr.calories - perMeal) < Math.abs(prev.calories - perMeal) ? curr : prev, candidates[0]);
      // avoid duplicates simple: if same as previous, pick next best
      if (chosen.find(c=>c.name === best.name)){
        const alt = candidates.find(c=>c.name !== best.name) || best;
        best = alt;
      }
      chosen.push(best);
    });
    return chosen;
  }

  if (calcBtn){
    calcBtn.addEventListener('click', ()=>{
      const age = Number(document.getElementById('age').value);
      const gender = document.getElementById('gender').value;
      const weight = Number(document.getElementById('weight').value);
      const height = Number(document.getElementById('height').value);
      const activity = Number(document.getElementById('activity').value);

      if (!age || !weight || !height) { alert('Please provide age, weight and height'); return; }

      const bmr = calculateBMR({age,gender,weight,height});
      const tdee = calculateTDEE(bmr, activity);
      caloriesSpan.textContent = tdee;

      // choose meals
      const meals = pickMealsForCalories(tdee);

      // render table
      mealTable.innerHTML = `
        <tr>
          <th>Meal</th>
          <th>Calories</th>
          <th>Protein (g)</th>
          <th>Carbs (g)</th>
          <th>Fats (g)</th>
        </tr>
      `;
      let totalCals = 0, totalProt=0, totalCarbs=0, totalFats=0;
      meals.forEach(m=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${m.name}</td><td>${m.calories}</td><td>${m.protein}</td><td>${m.carbs}</td><td>${m.fats}</td>`;
        mealTable.appendChild(tr);
        totalCals += m.calories; totalProt += m.protein; totalCarbs += m.carbs; totalFats += m.fats;
      });
      const totalsRow = document.createElement('tr'); totalsRow.className='totals';
      totalsRow.innerHTML = `<td><strong>Estimated Totals</strong></td><td><strong>${totalCals}</strong></td><td><strong>${totalProt}</strong></td><td><strong>${totalCarbs}</strong></td><td><strong>${totalFats}</strong></td>`;
      mealTable.appendChild(totalsRow);

      resultDiv.classList.remove('hidden');
    });
  }



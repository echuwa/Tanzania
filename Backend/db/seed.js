const bcrypt = require('bcryptjs');
const { sequelize, User, Module, Question, DailyStory, QuizAttempt } = require('../models');

async function seed() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection successful. Syncing models...');

    // Force sync deletes existing tables and recreates them
    await sequelize.sync({ force: true });
    console.log('Tables synced successfully!');

    // 1. Create Admin User
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      full_name: 'Msimamizi Muungano',
      phone_number: '+255700000000',
      role: 'admin',
      password: adminPasswordHash
    });
    console.log('Admin user created successfully.');

    // 2. Create Test Student User
    const userPasswordHash = await bcrypt.hash('user123', 10);
    const student = await User.create({
      full_name: 'Juma Ramadhani',
      phone_number: '+255711223344',
      role: 'user',
      points: 40,
      password: userPasswordHash
    });
    console.log('Test student user created successfully.');

    // 3. Create Modules
    const module1 = await Module.create({
      title: 'Chimbuko la Muungano (1964)',
      description: 'Sura hii inaangazia historia na mazingira yaliyopelekea Mwalimu Julius Nyerere na Abeid Amani Karume kuunganisha nchi za Tanganyika na Zanzibar tarehe 26 Aprili 1964.',
      order_index: 1
    });

    const module2 = await Module.create({
      title: 'Katiba na Muundo wa Muungano',
      description: 'Jifunze kuhusu jinsi Serikali ya Jamhuri ya Muungano wa Tanzania na Serikali ya Mapinduzi ya Zanzibar zinavyofanya kazi, na mambo ya Muungano.',
      order_index: 2
    });

    const module3 = await Module.create({
      title: 'Faida na Maendeleo ya Muungano',
      description: 'Sura hii inaeleza jinsi Muungano ulivyotuletea amani, usalama, mshikamano wa kijamii, na maendeleo ya kiuchumi kwa pande zote mbili.',
      order_index: 3
    });
    console.log('Modules created successfully.');

    // 4. Create Questions
    // Module 1 Questions
    await Question.create({
      module_id: module1.id,
      question_text: 'Muungano wa Tanganyika na Zanzibar ulianzishwa rasmi tarehe gani na mwaka gani?',
      options: [
        'A. 26 Aprili 1964',
        'B. 9 Desemba 1961',
        'C. 12 Januari 1964',
        'D. 26 Aprili 1977'
      ],
      correct_option: 0,
      points: 10
    });

    await Question.create({
      module_id: module1.id,
      question_text: 'Ni akina nani waliosaini Hati ya Muungano wa Tanganyika na Zanzibar?',
      options: [
        'A. Abeid Karume na Ali Hassan Mwinyi',
        'B. Mwalimu Julius Nyerere na Mzee Abeid Amani Karume',
        'C. Mwalimu Julius Nyerere na Edward Sokoine',
        'D. Rashid Kawawa na Abeid Karume'
      ],
      correct_option: 1,
      points: 10
    });

    // Module 2 Questions
    await Question.create({
      module_id: module2.id,
      question_text: 'Ni mambo mangapi ya Muungano yalianza nayo katika Hati ya kwanza ya Muungano mwaka 1964?',
      options: [
        'A. Mambo 11',
        'B. Mambo 22',
        'C. Mambo 7',
        'D. Mambo 15'
      ],
      correct_option: 0,
      points: 10
    });

    await Question.create({
      module_id: module2.id,
      question_text: 'Ni ipi kati ya zifuatazo SI jambo la Muungano kwa mujibu wa Katiba ya sasa ya Tanzania?',
      options: [
        'A. Ulinzi na Usalama',
        'B. Mambo ya Nje',
        'C. Ushuru wa Forodha',
        'D. Kilimo na Uvuvi'
      ],
      correct_option: 3,
      points: 10
    });

    // Module 3 Questions
    await Question.create({
      module_id: module3.id,
      question_text: 'Muungano wa Tanzania umetoa mchango gani wa kipekee katika bara la Afrika?',
      options: [
        'A. Ni mfano pekee wa muungano wa nchi mbili huru uliodumu kwa muda mrefu zaidi',
        'B. Kujenga reli ya TAZARA pekee',
        'C. Kuunda soko kubwa zaidi la mazao kuliko yote Afrika',
        'D. Hakuna mchango wowote'
      ],
      correct_option: 0,
      points: 10
    });
    console.log('Questions created successfully.');

    // 5. Create Daily Stories
    const today = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    await DailyStory.create({
      title: 'Hati ya Muungano na Siri ya Mwanzo',
      content: 'Siku chache kabla ya tarehe 26 Aprili 1964, Mwalimu Julius Nyerere alisafiri kwenda Zanzibar kwa siri kubwa kukutana na Mzee Abeid Amani Karume. Katika mazungumzo yao ya faragha, walikubaliana kuwa nchi hizi mbili zilikuwa zikikabiliwa na vitisho vikubwa vya kikoloni na ubeberu, na kwamba njia pekee ya kulinda uhuru na utu wa Waafrika ilikuwa kuungana na kuwa taifa moja imara na thabiti.',
      publish_date: today
    });

    await DailyStory.create({
      title: 'Tukio la Kuchanganya Udongo',
      content: 'Baada ya kusainiwa kwa Hati ya Muungano, sherehe kubwa ilifanyika katika Uwanja wa Karimjee jijini Dar es Salaam. Katika tukio la kihistoria linaloashiria umoja usiovunjika, Mwalimu Julius Nyerere na Mzee Abeid Amani Karume walichanganya udongo wa Tanganyika na wa Zanzibar kwenye chombo kimoja, wakionyesha kuwa tangu siku hiyo, ardhi na watu wa pande zote mbili wameunganishwa kuwa kitu kimoja cha daima.',
      publish_date: tomorrow
    });
    console.log('Daily stories seeded successfully.');

    // 6. Create a mock quiz attempt for student to have some activity data
    await QuizAttempt.create({
      user_id: student.id,
      module_id: module1.id,
      score: 20, // Got both questions correct (10 + 10 points)
      completed: true
    });
    console.log('Mock quiz attempts seeded successfully.');

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();

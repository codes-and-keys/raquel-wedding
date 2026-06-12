import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { Gift } from '@/types/gift';

dotenv.config({ path: '.env.local' });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

type GiftCategory = 'Eletrodomésticos' | 'Casa e Cozinha' | 'Cama, Mesa e Banho' | 'Experiências' | 'Lua de Mel';

interface GiftItem {
  name: string;
  inventory: number;
  reservedCount: number;
  description?: string;
  imageUrl: string;
  price: number;
  category: GiftCategory;
  externalUrl?: string;
  isAvailable: boolean;
}

const mockGifts: GiftItem[] = [
  {
    name: 'Fritadeira Air Fryer Forno Oven 12L Mondial',
    inventory: 1,
    reservedCount: 0,
    description: 'Essencial para a nossa rotina corrida. Cor: Preto/Inox.',
    imageUrl: 'https://m.media-amazon.com/images/I/51G4AxVAJxL._AC_SL1000_.jpg',
    price: 505.08,
    category: 'Eletrodomésticos',
    isAvailable: true,
    externalUrl: 'https://www.amazon.com.br/Fritadeira-Fryer-Forno-Litros-Mondial/dp/B0BZJDLT6Z/ref=sr_1_2_sspa?dib=eyJ2IjoiMSJ9.6klYrIDVsZ_9Tj-1aLWiUsO3UZjlhnls1580r2plOPOZzUgeoZwITnrBclE7kfdyWurK5VYVukK_MSwp_U6w4TvVYe4Vi7n0OyVHyhdNVDVIY7RAjT5GrZBhErih16qUV6aXyswkc7pKJT1pe7uN2frlvJgh1Zi8TMfdwZzuuW9HBzVmYyGXiWPQKW1rnv2fTX30ZhqnbTdBwc7Mftd36XXLglmiWttM0YbG-BmoHRkRAms3bp3vPk8Fr2CqwpYGtypWrRkl1p629ZLMrN2wRFER_m7-1sSCFc8lQsalsO4.mDVHbj1gsHNvy8m_5869yvmMqOS196ya96zbXyUiY0A&dib_tag=se&keywords=Airfryer&qid=1772662982&sr=8-2-spons&ufe=app_do%3Aamzn1.fos.25548f35-0de7-44b3-b28e-0f56f3f96147&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&th=1'
  },
  {
    name: 'Aspirador e esfregão robô Qrevo S5V',
    inventory: 1,
    reservedCount: 0,
    description: 'Para nos ajudar a manter a casa limpa sem esforço.',
    imageUrl: 'https://m.media-amazon.com/images/I/51Br5OrimUL._AC_SL1500_.jpg',
    price: 5668.73,
    category: 'Eletrodomésticos',
    isAvailable: true,
    externalUrl: 'https://www.amazon.com.br/roborock-Qrevo-S5V-emaranhamento-inteligente/dp/B0DSP8J476/ref=sr_1_1_sspa?__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=1MNPHR68QPSOO&dib=eyJ2IjoiMSJ9.R2kRMqmTu83bcAR2Z3xVYpVbRqzn7r1P1jVx2kIloQEICFy8hbq8yP1wZtmHhMV_jKSg7wnKNiuvlWJUSgkxDgw5kv-mhefWp57aPIge0h1ZrA7MjlCcidzBSAD0b0xiWo01aQprse1jZJeBAXZAq0ZVF_FWCvRrJLTB8w3HFeVSsBjHtsXQEkYjJ_ottkgLi-l0QrzaV3pgZU_i-FHf-ugpp8BJS9yGI0JWXMczyN66fxRmQr71ZA0rxHhPYwsvlo1E1489nFiqBO3PHkI4gtMtnW7tLzmUkW98EbFOmuQ.3FdaXgvo8xYzDNSHBvk7UQxbl9FIxcjUItZAo-gqE88&dib_tag=se&keywords=aspirador%2Brobo&qid=1772663041&sprefix=aspirador%2Brobo%2Caps%2C206&sr=8-1-spons&ufe=app_do%3Aamzn1.fos.25548f35-0de7-44b3-b28e-0f56f3f96147&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&th=1'
  },
  {
    name: 'Jogo de Panelas, Tramontina',
    inventory: 1,
    reservedCount: 0,
    description: 'Conjunto de 8 peças com revestimento antiaderente.',
    imageUrl: 'https://m.media-amazon.com/images/I/51ibkHHTeAL._AC_SL1200_.jpg',
    price: 339.99,
    category: 'Casa e Cozinha',
    isAvailable: true,
    externalUrl: 'https://www.amazon.com.br/Alum%C3%ADnio-Revestimento-Cer%C3%A2mico-Antiaderente-Tuut/dp/B0FC82PDXC/ref=sr_1_1_sspa?crid=1UPCWOZAPZE50&dib=eyJ2IjoiMSJ9.kX2dYACnp980711YhTIE_G9fwRoIK8mSYvfU1K6eSqhwdb-tGViIYDakgXrp-1R6o0grdcz7fBeDd2cyLyLtS5tKxOVvBsTr5_8uLmp0k1Jdz2-IDfJmcb4B__XpoL8YSqwYHoXALWy4DsILwqUSkGTtj6iz9yU38Dfv5z5G_uTk0tvVJ8pqCJEm9Rimx0YTgCYToMNArz3njQBND8XdZf3QtzzlfUL5yvVedZYhgbO1_Xjtmqn626uIfANLgoq0Zv54i6_GeH9XGFHFWRkNzZWRSIXQHPmjP9F6m7ElBrc.TD21rjlZK-AvmpDxTtxybVZLm3ezOX_bQQ2JG-Li4v0&dib_tag=se&keywords=jogo+de+panelas+tramontina&qid=1772663136&sprefix=Jogo+de+panelas+tr%2Caps%2C219&sr=8-1-spons&ufe=app_do%3Aamzn1.fos.fcd6d665-32ba-4479-9f21-b774e276a678&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1'
  },
  {
    name: 'Cafeteira Nespresso Essenza Mini',
    inventory: 1,
    reservedCount: 0,
    description: 'Para nossos cafés da manhã juntos.',
    imageUrl: 'https://m.media-amazon.com/images/I/51OmeGN0wGL._AC_SL1000_.jpg',
    price: 569.00,
    category: 'Eletrodomésticos',
    isAvailable: true,
    externalUrl: 'https://www.amazon.com.br/Nespresso-Cafeteira-Espresso-compacta-autom%C3%A1tica/dp/B099ZCGZK9/ref=sr_1_10?__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=3NUWSI4AN2E94&dib=eyJ2IjoiMSJ9.TfiZ9ajmqv4mAAcBmXCvPL3qqy6m1fWCnSQqzVoLMjA9mRQjUVV0Q5hwYlwwg48uuDKnUFM1xjOXwUJLsndHrVhfTzr7TN2lGW0_TiHXPxdqfg6VGpLMx-CkJqOxxs3OU1N-7_rOBaWFP1yj6Ys-nzlqXya6T4KHCFgzP1wUwL81niCL6RcjcYFLK8RpzwD082OeFljqsFB4QhOW-v5y3rlemXge1c8iq-ky2CkY1BnyswebHIynsM4Dxdg9qNfwg5tTFxf8aOPBAD8sWk1qKvaFw_sigu8SfF-RRmXImrU.mOzrHT2XluAaUScibXimSEcpmOtpyKe3jC0rmYwG7Tk&dib_tag=se&keywords=nespresso&qid=1772663185&sprefix=nespress%2Caps%2C205&sr=8-10&ufe=app_do%3Aamzn1.fos.9e6a115c-05b9-4b96-8e1c-b1f9ce2ac1a6&th=1'
  },
  {
    name: 'Jogo de Lençol Budemeyer 300 Fios',
    inventory: 1,
    reservedCount: 0,
    description: 'Conforto para o nosso quarto. Tamanho Queen, cor branca.',
    imageUrl: 'https://m.media-amazon.com/images/I/31WcujMFMhS._AC_SL1000_.jpg',
    price: 320.00,
    category: 'Cama, Mesa e Banho',
    isAvailable: true,
    externalUrl: 'https://www.amazon.com.br/Buddemeyer-Vision-Colors-Algod%C3%A3o-Penteado/dp/B086W2J76Z/ref=sr_1_3_sspa?__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=3PTDCM1D272S2&dib=eyJ2IjoiMSJ9.S069llVIX2-3auwBj4Cffy5McPJBHE3lZtilMsf5yz2Teb89NZkr2gFSiV6AfoGLnVTTVLn4OVM9Hn4-y6xrCLm63y25azz2rhDyUhxQTUUwS6abxqqdxXSY7L6CT3WzT6crJ2Hn2gb_dDkvcpTcyWdp5spfZM8dlnGjXYkX5S7K2XYJKV_2wNfGmYwIY0BXv0TVx__l03qL-_NgUNh7XmrVmg8Lwi9E2KqSI5qUV3dDtQKptlZb678lub-bhtAWQe7XndFLYRiinDWcAYBy4N24tviDDGkVYXpbUAgLSYw.RnbplAyaXK2UxG0Tfl730DXhjLBpbT_LM9f6bOaWyY4&dib_tag=se&keywords=jogo%2Bde%2Blen%C3%A7ol%2Bbuddemeyer%2B300%2Bfios&qid=1772663223&sprefix=jogo%2Bde%2Blen%C3%A7ol%2Bbudemeyer%2B300%2Bfios%2Caps%2C200&sr=8-3-spons&ufe=app_do%3Aamzn1.fos.4bddec23-2dcf-4403-8597-e1a02442043d&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&th=1'
  },
  {
    name: 'Jantar Romântico na Lua de Mel',
    inventory: 4,
    reservedCount: 0,
    description: 'Cota para um jantar especial durante a nossa viagem.',
    imageUrl: 'https://image-tc.galaxy.tf/wijpeg-371yp6cpeobfl83grl0xkc25w/fld-dinner-by-the-bay-1-web-resized.jpg?width=1920',
    price: 350.00,
    category: 'Experiências',
    isAvailable: true
  },
  {
    name: 'Passeio Turístico / Excursão',
    inventory: 4,
    reservedCount: 0,
    description: 'Cota para aproveitarmos as atrações locais na lua de mel.',
    imageUrl: 'https://simplevoos.com.br/wp-content/webp-express/webp-images/uploads/2025/02/destinos-romanticos.jpg.webp',
    price: 500.00,
    category: 'Experiências',
    isAvailable: true
  },
  {
    name: 'Cota Master - Ajude na Lua de Mel',
    inventory: 2,
    reservedCount: 0,
    description: 'Uma contribuição livre para nos ajudar a realizar a viagem dos sonhos.',
    imageUrl: 'https://virtualjoias.com/media/wysiwyg/virtualjoias-0902-Lugares-para-passar-lua-de-mel-imagem1-blog.jpg',
    price: 1000.00,
    category: 'Lua de Mel',
    isAvailable: true
  }
];

async function seedGifts() {
  console.log('Iniciando o processo de Seed de Presentes no Firestore...');
  
  const batch = db.batch();
  const collectionRef = db.collection('gifts');

  for (const gift of mockGifts) {
    const docRef = collectionRef.doc();
    batch.set(docRef, {
      ...gift,
      createdAt: new Date(),
    });
  }

  try {
    await batch.commit();
    console.log(`✅ Sucesso: ${mockGifts.length} presentes inseridos no banco de dados.`);
    console.log('Acesse a rota /presentes no seu navegador para visualizar o resultado.');
  } catch (error) {
    console.error('❌ Erro ao inserir dados de presentes:', error);
  }
}

seedGifts();
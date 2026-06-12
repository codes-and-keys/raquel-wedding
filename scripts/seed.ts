import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });


console.log(process.env.FIREBASE_PROJECT_ID);
console.log(process.env.FIREBASE_CLIENT_EMAIL);
console.log(process.env.FIREBASE_PRIVATE_KEY);

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

const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateUniqueCode(length = 5): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

const rawGuests = [
  "Andreia", "Adriana", "Luan", "Letícia", "Guilherme", "Melissa", "Ignês", 
  "Ana paula", "Geraldo", "Gabriel", "Yumi", "Daniel", "Rubens Jr.", "Bruna", 
  "Day", "Rubens", "Rafael", "Sabrina Janz", "Vitor", "Bianca kapp", "Jonas", 
  "Nathaly", "Julia Oliveira", "Felipe", "Edvaldo", "Nathalya pupo", "Caio", 
  "Vanessa", "Eduardo", "Lucas", "Julia", "Tia rosa", "Joyce", "Isabella", 
  "Adriano", "Taty Aguiar", "Maria Luiza", "Betania", "Fabrício", "Ygor", 
  "Filipe Scarassati", "Beatriz", "João Vitor", "Thayna", "Gustavo", "Pablo", 
  "Nathalia", "Roberto Andrey", "Nathalia Porfirio", "Roberta", "Regiane", 
  "Damiana", "Vó Maria", "Vô José", "Vô José Ribeiro", "Karine", "Ale", 
  "Laura", "Vanda", "Israel", "Kelvyn", "Gabrielle", "Matias", "Alexandra", 
  "Sofia", "Valentina", "Mateus", "Gicely", "Jennifer", "Leonardo", "Eduardo", 
  "Giovanna", "Fabrizio", "Pietro", "Andressa", "Steven", "Romina", 
  "Vó Francisca", "Nilton", "Duda", "Rafa", "Mãe", "Pai", "Daiane", 
  "Kaique", "Tuba", "Mãe da daí"
];

async function seedDatabase() {
  console.log('Iniciando o processo de Seed no Firestore...');
  
  const batch = db.batch();
  const collectionRef = db.collection('guests');
  
  const generatedCodes = new Set<string>();
  const outputData: { Nome: string; Codigo: string }[] = [];

  for (const name of rawGuests) {
    let code: string;
    
    do {
      code = generateUniqueCode();
    } while (generatedCodes.has(code));
    
    generatedCodes.add(code);

    const cleanName = name.trim();

    const docRef = collectionRef.doc();
    batch.set(docRef, {
      code: code,
      name: cleanName,
      isAttending: null,
      updatedAt: null,
    });

    outputData.push({ Nome: cleanName, Codigo: code });
  }

  try {
    await batch.commit();
    console.log(`✅ Sucesso: ${rawGuests.length} convidados inseridos no banco.`);
    
    const csvContent = "Nome,Codigo\n" + outputData.map(g => `"${g.Nome}","${g.Codigo}"`).join("\n");
    fs.writeFileSync('lista_convidados_com_codigos.csv', csvContent);
    
    console.log('📄 Arquivo "lista_convidados_com_codigos.csv" gerado com sucesso na raiz do projeto.');
    console.log('Entregue este arquivo para a cliente. Ela precisará dele para enviar os convites.');
  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error);
  }
}

seedDatabase();
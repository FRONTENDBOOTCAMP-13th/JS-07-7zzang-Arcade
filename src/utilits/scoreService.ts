import { db } from './firebase.ts';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// 인증 객체 가져오기
const auth = getAuth();

// 익명 로그인 보장 함수
function ensureAuthReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) return resolve();

    onAuthStateChanged(auth, user => {
      if (user) resolve();
    });

    signInAnonymously(auth).catch(reject);
  });
}

// 중복 닉네임 처리 위해 문서 id 설정 (닉네임 대문자 처리로 표준화)
function normalizeNickname(nickname: string) {
  return nickname
    .trim()
    .replace(/[^가-힣a-zA-Z]/g, '')
    .toUpperCase();
}

// Firestore에 사용자 점수 저장 위한 함수.
export async function fireScore(nickname: string, score: number, game: string) {
  await ensureAuthReady(); // 익명 로그인 설정

  const safeNickname = normalizeNickname(nickname);
  const docId = `${safeNickname}_${game}`;

  const docRef = doc(db, 'scores', docId);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    throw new Error('해당 닉네임은 이미 등록된 닉네임입니다.');
  }

  await setDoc(docRef, {
    nickname,
    score,
    game,
    updatedAt: Timestamp.now(),
  });
}

// 파이어베이스에서 점수 조회 위한 함수
export async function getTopScores(game: string) {
  const q = query(collection(db, 'scores'), where('game', '==', game), orderBy('score', 'desc'), limit(5));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

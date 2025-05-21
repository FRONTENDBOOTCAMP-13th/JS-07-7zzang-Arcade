// 점수 관련 db

import { db } from './firebase.ts';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

// 파이어스토어에 해당 데이터 문서에 추가
export async function fireScore(nickname: string, score: number, game: string) {
  const safeNickname = nickname.trim().toLowerCase();
  const docId = `${safeNickname}_${game}`; // 문서 ID -> 닉네임, 게임 하나의 id로 묶어서 중복 방지

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

// 쿼리 사용 통해 파이어베이스에서 scores 컬렉션 가져오고, game 필드의 파라미터 game이 같을 경우, 내림차순 한 상위 5개
export async function getTopScores(game: string) {
  const q = query(collection(db, 'scores'), where('game', '==', game), orderBy('score', 'desc'), limit(5));

  // 쿼리 거쳐서 해당 문서의 데이터 리턴
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

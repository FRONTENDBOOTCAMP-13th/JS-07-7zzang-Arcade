// 점수 관련 db

import { db } from './firebase.ts';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

// 파이어스토어에 해당 데이터 문서에 추가
export async function fireScore(nickname: string, score: number, game: string) {
  await addDoc(collection(db, 'scores'), {
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

import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement } from '../store/counterSlice';

export const Counter = () => {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Тест Redux: {count}</h2>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
    </div>
  );
};
import locationInit from './loaction';
const init = process.env.NODE_ENV === 'production' ? () => {} : locationInit
export default init;

import { FaArrowUp } from 'react-icons/fa';
import { useForm } from 'react-hook-form';

const ChatInput = ({ onSubmit, disabled = false }) => {
  const { register, handleSubmit, reset, formState } = useForm();

  //function returned from calling handleSubmit from react-hook-form
  const submit = handleSubmit((data) => {
    reset({ prompt: '' });
    onSubmit(data);
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={handleKeyDown}
      className='chat-input'
    >
      <textarea
        {...register('prompt', {
          required: true,
          validate: (data) => data.trim().length > 0,
        })}
        autoFocus
        placeholder='Ask something like “Show total revenue by month” or “List top 10 customers.”'
        aria-label='Ask a question about your database'
        maxLength={1000}
        disabled={disabled}
      />
      <button
        disabled={!formState.isValid || disabled}
        className='btn primary'
        type='submit'
      >
        <FaArrowUp />
      </button>
    </form>
  );
};

export default ChatInput;

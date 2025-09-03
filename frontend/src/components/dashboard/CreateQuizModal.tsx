'use client';

import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CreateQuizFormValues, Quiz } from '@/types/quiz.type';
import { createQuiz } from '@/services/quiz.service';
import { X, PlusCircle, Trash2, Check } from 'lucide-react';

const optionSchema = z.object({
    option_text: z.string().min(1, "Option text cannot be empty."),
    is_correct: z.boolean(),
});

const questionSchema = z.object({
    question_text: z.string().min(3, "Question text cannot be empty."),
    question_type: z.enum(['single-choice', 'multiple-choice']),
    options: z.array(optionSchema).min(2, "Must have at least two options."),
}).refine(data => {
    if (data.question_type === 'single-choice') {
        return data.options.filter(opt => opt.is_correct).length === 1;
    }
    return data.options.filter(opt => opt.is_correct).length >= 1;
}, {
    message: "Single-choice questions must have exactly one correct answer, and multiple-choice must have at least one.",
    path: ["options"],
});

const quizSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long."),
    description: z.string().optional(),
    questions: z.array(questionSchema).min(1, "Quiz must have at least one question."),
});

// We can infer the type directly from the schema
type QuizFormValues = z.infer<typeof quizSchema>;

interface CreateQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (newQuiz: Quiz) => void;
}

const CreateQuizModal = ({ isOpen, onClose, onCreated }: CreateQuizModalProps) => {
    const { register, control, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<QuizFormValues>({
        resolver: zodResolver(quizSchema),
        defaultValues: {
            title: '',
            description: '',
            questions: [{ question_text: '', question_type: 'single-choice', options: [{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }] }]
        }
    });

    const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
        control,
        name: "questions"
    });

    const onSubmit = async (data: QuizFormValues) => {
        try {
            // The data structure from the form matches the required payload
            const newQuiz = await createQuiz(data);
            toast.success("Quiz created successfully!");
            onCreated(newQuiz);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create quiz.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-dark-blue border border-white/20 rounded-2xl shadow-lg w-full max-w-3xl p-6 m-4 text-white flex flex-col h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold">Create New Quiz</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-grow overflow-y-auto custom-scrollbar pr-4">
                    {/* Quiz Details */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Quiz Title</label>
                            <input {...register('title')} placeholder="e.g., Company Security Policies" className="input-glass w-full" />
                            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                            <textarea {...register('description')} rows={2} className="input-glass w-full" />
                        </div>
                    </div>

                    <div className="border-b border-white/10"></div>

                    {/* Questions */}
                    <div className="space-y-6">
                        {questionFields.map((question, qIndex) => (
                            <QuestionForm key={question.id} qIndex={qIndex} control={control} register={register} errors={errors} removeQuestion={removeQuestion} watch={watch} />
                        ))}
                    </div>
                     <button type="button" onClick={() => appendQuestion({ question_text: '', question_type: 'single-choice', options: [{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }] })} className="btn-secondary">
                        <PlusCircle size={18} className="mr-2"/> Add Question
                    </button>
                </form>

                 <div className="flex justify-end gap-4 pt-4 flex-shrink-0 border-t border-white/10 mt-4">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="btn-primary">
                        {isSubmitting ? 'Creating...' : 'Create Quiz'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const QuestionForm = ({ qIndex, control, register, errors, removeQuestion, watch }: any) => {
    const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
        control,
        name: `questions.${qIndex}.options`
    });
    
    const questionType = watch(`questions.${qIndex}.question_type`);

    return (
         <div className="p-4 bg-black/20 border border-white/10 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
                 <h3 className="font-bold text-lg">Question {qIndex + 1}</h3>
                 <button type="button" onClick={() => removeQuestion(qIndex)} className="text-gray-500 hover:text-red-500"><Trash2 size={18}/></button>
            </div>
            <textarea {...register(`questions.${qIndex}.question_text`)} placeholder="Enter your question here" className="input-glass w-full" rows={2}/>
            {errors.questions?.[qIndex]?.question_text && <p className="text-red-400 text-xs mt-1">{errors.questions[qIndex].question_text.message}</p>}

             <Controller
                control={control}
                name={`questions.${qIndex}.question_type`}
                render={({ field }) => (
                    <select {...field} className="input-glass w-full md:w-1/3">
                        <option value="single-choice">Single Choice</option>
                        <option value="multiple-choice">Multiple Choice</option>
                    </select>
                )}
            />
             {errors.questions?.[qIndex]?.options && <p className="text-red-400 text-xs mt-1">{errors.questions[qIndex].options.message}</p>}

            {/* Options */}
            <div className="space-y-3">
            {optionFields.map((option, oIndex) => (
                <div key={option.id} className="flex items-center gap-3">
                    <Controller
                        name={`questions.${qIndex}.options.${oIndex}.is_correct`}
                        control={control}
                        render={({ field }) => (
                            <button type="button" onClick={() => field.onChange(!field.value)} className={`w-6 h-6 flex-shrink-0 flex items-center justify-center border-2 rounded-md transition-colors ${field.value ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
                                {field.value && <Check size={16} className="text-white"/>}
                            </button>
                        )}
                    />
                    <input {...register(`questions.${qIndex}.options.${oIndex}.option_text`)} placeholder={`Option ${oIndex + 1}`} className="input-glass w-full" />
                    <button type="button" onClick={() => removeOption(oIndex)} className="text-gray-500 hover:text-red-500"><X className="h-5 w-5"/></button>
                </div>
            ))}
             <button type="button" onClick={() => appendOption({ option_text: '', is_correct: false })} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm">
                <PlusCircle size={16} /> Add Option
            </button>
            </div>
        </div>
    )
}

export default CreateQuizModal; 
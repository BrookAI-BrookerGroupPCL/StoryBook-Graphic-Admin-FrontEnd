import React, { useState, useRef, useEffect } from 'react';
import { TextBoxType } from '@/types/editor';

interface TextBoxProps {
  textBox: TextBoxType;
  updateTextBox: (textBox: TextBoxType) => void;
  isSelected?: boolean;
  onDelete?: () => void;
}

const TextBox: React.FC<TextBoxProps> = ({ textBox, updateTextBox, isSelected, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [initialResize, setInitialResize] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const textBoxRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateTextBox({
          ...textBox,
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }

      if (isResizing) {
        const newWidth = Math.max(50, initialResize.width + (e.clientX - initialResize.x));
        const newHeight = Math.max(20, initialResize.height + (e.clientY - initialResize.y));

        updateTextBox({
          ...textBox,
          width: newWidth,
          height: newHeight,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, textBox, initialResize, updateTextBox]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing) {
      e.preventDefault();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - textBox.x,
        y: e.clientY - textBox.y,
      });
    }
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setInitialResize({
      width: textBox.width,
      height: textBox.height,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateTextBox({
      ...textBox,
      content: e.target.value,
    });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div
      ref={textBoxRef}
      className="cursor-move"
      style={{
        width: textBox.width,
        height: textBox.height,
        border: textBox.borderWidth ? `${textBox.borderWidth}px solid ${textBox.borderColor}` : 'none',
        overflow: 'hidden',
        // backgroundColor: 'white',
        backgroundColor: textBox.backgroundColor || 'transparent',
        zIndex: isSelected ? 20 : 5,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="w-full h-full p-1 resize-none outline-none border-2 border-editor-blue"
          style={{
            fontSize: `${textBox.fontSize}px`,
            fontFamily: `"${textBox.fontFamily}", Arial, sans-serif`,
            color: textBox.color,
            // fontWeight: textBox.isBold ? 'bold' : 'normal',
            // fontStyle: textBox.isItalic ? 'italic' : 'normal',
            textDecoration: textBox.isUnderlined ? 'underline' : 'none',
            textAlign: textBox.textAlign || 'left',
            lineHeight: 1.3, // <- IMPORTANT: browser default is ~1.2-1.4
            margin: 0,
            padding: 0,
          }}
          value={textBox.content}
          onChange={handleContentChange}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="w-full h-full p-1 overflow-hidden"
          style={{
            fontSize: `${textBox.fontSize}px`,
            // fontFamily: textBox.fontFamily || 'Arial',
            fontFamily: `"${textBox.fontFamily}", Arial, sans-serif`,
            color: textBox.color,
            // fontWeight: textBox.isBold ? 'bold' : 'normal',
            // fontStyle: textBox.isItalic ? 'italic' : 'normal',
            textDecoration: textBox.isUnderlined ? 'underline' : 'none',
            textAlign: textBox.textAlign || 'left',
            lineHeight: 1.3, // <- IMPORTANT: browser default is ~1.2-1.4
            margin: 0,
            padding: 0,
            whiteSpace: 'pre-line',
          }}
        >
          {textBox.content}
        </div>
      )}

      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-editor-blue rounded-sm cursor-nwse-resize"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
};

export default TextBox;

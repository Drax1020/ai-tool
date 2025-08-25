import React, { useEffect, useState } from 'react'
import { checkHeading, replaceHeadingStars } from '../helper';


import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism/';




const Answer = ({ ans, totalResult, index, type }) => {

  const [heading, setHeading] = useState(false);
  const [answer, setAnswr] = useState(ans)

  useEffect(() => {
    if (checkHeading(ans)) {
      setHeading(true);
      setAnswr(replaceHeadingStars(ans))
    }
  }, [ans])

  const renderer = {
    code({node, inline, className, children, ...props}){
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
          <SyntaxHighlighter 
          {...props}
          children={String(children).replace(/\n$/,'')}
          language={match[1]}
          style={atomDark}
          PreTag="div"
          />
        ):(
          <code {...props} className={className}>
            {children}
          </code>
        )
    }
  }

  return (
    <>
      {

        index == 0 && totalResult > 1 ? <span className='pt-2 text-xl block text-white'>{answer}</span> :

          heading ? <span className='pt-2 text-lg block text-white'>{answer}</span>
            : <span className={type == 'q' ? 'pl-1' : 'pl-5'}>
              <ReactMarkdown components={renderer}>{answer}</ReactMarkdown>
            </span>

      }
    </>
  );
}

export default Answer
import React from 'react'; import { renderTemplateDocument } from './templateDocument';
export default function InvoiceTemplate1(props) { return <div dangerouslySetInnerHTML={{ __html: renderTemplateDocument(1, props) }} />; }

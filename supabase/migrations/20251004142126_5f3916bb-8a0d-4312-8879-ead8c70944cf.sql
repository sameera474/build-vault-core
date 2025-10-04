-- Remove duplicate company names, keeping only one of each

-- Delete duplicate "Alpha Construction Ltd" (keep cf8e9777-1d1b-4c67-8845-668008a0401c which has the demo users)
DELETE FROM companies 
WHERE name = 'Alpha Construction Ltd' 
AND id = '8326feb8-4b84-4d6a-8476-0ab4c582dff2';

-- Delete duplicate "Beta Engineering Corp" (keep 99714a59-c537-4eda-bce7-d516c0fd33d5, delete the others)
DELETE FROM companies 
WHERE name = 'Beta Engineering Corp' 
AND id IN ('178fbc2d-9f95-4f57-8fb0-ea077463140f', '82ca8675-2abf-44c0-bf34-590aada2560c');

-- Delete duplicate "Gamma Materials Inc" (keep aa17c2a2-9cae-4cec-a7f8-b2094458a184, delete 2f0bc9c3-e62a-45d1-8549-0954c585a228)
DELETE FROM companies 
WHERE name = 'Gamma Materials Inc' 
AND id = '2f0bc9c3-e62a-45d1-8549-0954c585a228';
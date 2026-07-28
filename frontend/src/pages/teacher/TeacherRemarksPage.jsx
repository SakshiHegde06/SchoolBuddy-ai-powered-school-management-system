import { useState } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import FormField, { inputClass } from '../../components/common/FormField'
import { useFetch } from '../../hooks/useFetch'
import { studentService } from '../../services/studentService'
import { remarkService } from '../../services/remarkService'

export default function TeacherRemarksPage() {

    const { data: students } = useFetch(() => studentService.list(), [])

    const [studentId, setStudentId] = useState("")
    const [remark, setRemark] = useState("")
    const [message, setMessage] = useState("")

    async function saveRemark() {

        if (!studentId || !remark.trim()) {

            setMessage("Please select a student and write a remark.")
            return
        }

        try {

            await remarkService.create({

                studentId,
                remark

            })

            setRemark("")
            setMessage("Remark saved successfully.")

        } catch (err) {

            setMessage(

                err.response?.data?.message ||

                "Failed to save remark."

            )
        }

    }

    return (

        <Card title="Student Remarks">

            <FormField label="Student">

                <select
                    className={inputClass}
                    value={studentId}
                    onChange={(e)=>setStudentId(e.target.value)}
                >

                    <option value="">
                        Select Student
                    </option>

                    {students?.map(student=>(
                        <option
                            key={student.id}
                            value={student.id}
                        >
                            {student.name}
                        </option>
                    ))}

                </select>

            </FormField>

            <FormField label="Remark">

                <textarea
                    rows={5}
                    className={inputClass}
                    value={remark}
                    onChange={(e)=>setRemark(e.target.value)}
                />

            </FormField>

            <Button
                variant="primary"
                onClick={saveRemark}
            >
                Save Remark
            </Button>

            {message &&
                <p className="mt-4 text-sm">
                    {message}
                </p>
            }

        </Card>

    )

}
// Deterministic DEMO subject fixtures. These responses are part of the
// development and testing contract (see docs/decisions.md) and intentionally
// mirror the HTML shape returned by the live Tanrend endpoint.

const DEMO_SUBJECTS = {
  "DEMO-1": `
      <table id="resulttable">
        <tbody>
          <tr>
            <td>Monday 10:00-11:30</td>
            <td>DEMO-1-1 (lecture)</td>
            <td>Introduction to Web Development</td>
            <td>North Building 2.42</td>
            <td></td>
            <td>Dr. Jane Smith</td>
          </tr>
          <tr>
            <td>Wednesday 14:00-15:30</td>
            <td>DEMO-1-1 (practice)</td>
            <td>Introduction to Web Development</td>
            <td>South Building 1.12</td>
            <td></td>
            <td>John Doe</td>
          </tr>
          <tr>
            <td>Friday 10:00-11:30</td>
            <td>DEMO-1-2 (lecture)</td>
            <td>Introduction to Web Development</td>
            <td>North Building 2.42</td>
            <td></td>
            <td>Dr. Jane Smith</td>
          </tr>
          <tr>
            <td>Thursday 16:00-17:30</td>
            <td>DEMO-1-2 (practice)</td>
            <td>Introduction to Web Development</td>
            <td>Lágymányos Campus D.0.16</td>
            <td></td>
            <td>Jane Doe</td>
          </tr>
        </tbody>
      </table>
    `,
  "DEMO-2": `
      <table id="resulttable">
        <tbody>
          <tr>
            <td>Tuesday 08:00-09:30</td>
            <td>DEMO-2-1 (lecture)</td>
            <td>Advanced Database Systems</td>
            <td>North Building 4.56</td>
            <td></td>
            <td>Prof. Robert Johnson</td>
          </tr>
          <tr>
            <td>Tuesday 12:00-13:30</td>
            <td>DEMO-2-1 (practice)</td>
            <td>Advanced Database Systems</td>
            <td>South Building 3.21</td>
            <td></td>
            <td>Michael Brown</td>
          </tr>
          <tr>
            <td>Thursday 08:00-09:30</td>
            <td>DEMO-2-2 (lecture)</td>
            <td>Advanced Database Systems</td>
            <td>North Building 4.56</td>
            <td></td>
            <td>Prof. Robert Johnson</td>
          </tr>
          <tr>
            <td>Friday 14:00-15:30</td>
            <td>DEMO-2-2 (practice)</td>
            <td>Advanced Database Systems</td>
            <td>Lágymányos Campus D.1.28</td>
            <td></td>
            <td>Sarah Wilson</td>
          </tr>
        </tbody>
      </table>
    `,
  "DEMO-3": `
      <table id="resulttable">
        <tbody>
          <tr>
            <td>Monday 12:00-13:30</td>
            <td>DEMO-3-1 (lecture)</td>
            <td>Algorithms and Data Structures</td>
            <td>North Building 3.14</td>
            <td></td>
            <td>Dr. Alice Chen</td>
          </tr>
          <tr>
            <td>Monday 14:00-15:30</td>
            <td>DEMO-3-1 (practice)</td>
            <td>Algorithms and Data Structures</td>
            <td>South Building 2.08</td>
            <td></td>
            <td>Tom Anderson</td>
          </tr>
          <tr>
            <td>Wednesday 08:00-09:30</td>
            <td>DEMO-3-2 (lecture)</td>
            <td>Algorithms and Data Structures</td>
            <td>North Building 3.14</td>
            <td></td>
            <td>Dr. Alice Chen</td>
          </tr>
          <tr>
            <td>Wednesday 16:00-17:30</td>
            <td>DEMO-3-2 (practice)</td>
            <td>Algorithms and Data Structures</td>
            <td>Lágymányos Campus D.2.12</td>
            <td></td>
            <td>Emma Davis</td>
          </tr>
          <tr>
            <td>Thursday 12:00-13:30</td>
            <td>DEMO-3-3 (lecture)</td>
            <td>Algorithms and Data Structures</td>
            <td>North Building 3.14</td>
            <td></td>
            <td>Dr. Alice Chen</td>
          </tr>
          <tr>
            <td>Friday 18:00-19:30</td>
            <td>DEMO-3-3 (practice)</td>
            <td>Algorithms and Data Structures</td>
            <td>South Building 1.05</td>
            <td></td>
            <td>Oliver White</td>
          </tr>
        </tbody>
      </table>
    `,
  "DEMO-4": `
      <table id="resulttable">
        <tbody>
          <tr>
            <td>Monday 10:00-11:30</td>
            <td>DEMO-4-1 (lecture)</td>
            <td>Machine Learning Fundamentals</td>
            <td>North Building 5.10</td>
            <td></td>
            <td>Prof. David Martinez</td>
          </tr>
          <tr>
            <td>Tuesday 10:00-11:30</td>
            <td>DEMO-4-1 (practice)</td>
            <td>Machine Learning Fundamentals</td>
            <td>Computer Lab A</td>
            <td></td>
            <td>Lisa Thompson</td>
          </tr>
          <tr>
            <td>Wednesday 12:00-13:30</td>
            <td>DEMO-4-2 (lecture)</td>
            <td>Machine Learning Fundamentals</td>
            <td>North Building 5.10</td>
            <td></td>
            <td>Prof. David Martinez</td>
          </tr>
          <tr>
            <td>Thursday 14:00-15:30</td>
            <td>DEMO-4-2 (practice)</td>
            <td>Machine Learning Fundamentals</td>
            <td>Computer Lab B</td>
            <td></td>
            <td>Kevin Lee</td>
          </tr>
          <tr>
            <td>Friday 12:00-13:30</td>
            <td>DEMO-4-3 (lecture)</td>
            <td>Machine Learning Fundamentals</td>
            <td>North Building 5.10</td>
            <td></td>
            <td>Prof. David Martinez</td>
          </tr>
          <tr>
            <td>Friday 18:00-19:30</td>
            <td>DEMO-4-3 (practice)</td>
            <td>Machine Learning Fundamentals</td>
            <td>Computer Lab C</td>
            <td></td>
            <td>Maria Garcia</td>
          </tr>
        </tbody>
      </table>
    `,
  "DEMO-5": `
      <table id="resulttable">
        <tbody>
          <tr>
            <td>Tuesday 08:00-09:30</td>
            <td>DEMO-5-1 (lecture)</td>
            <td>Operating Systems</td>
            <td>North Building 1.22</td>
            <td></td>
            <td>Dr. Helen Brown</td>
          </tr>
          <tr>
            <td>Tuesday 18:00-19:30</td>
            <td>DEMO-5-1 (practice)</td>
            <td>Operating Systems</td>
            <td>South Building 4.15</td>
            <td></td>
            <td>Paul Miller</td>
          </tr>
          <tr>
            <td>Thursday 08:00-09:30</td>
            <td>DEMO-5-2 (lecture)</td>
            <td>Operating Systems</td>
            <td>North Building 1.22</td>
            <td></td>
            <td>Dr. Helen Brown</td>
          </tr>
          <tr>
            <td>Thursday 18:00-19:30</td>
            <td>DEMO-5-2 (practice)</td>
            <td>Operating Systems</td>
            <td>Lágymányos Campus D.3.45</td>
            <td></td>
            <td>Sophie Turner</td>
          </tr>
          <tr>
            <td>Friday 08:00-09:30</td>
            <td>DEMO-5-3 (lecture)</td>
            <td>Operating Systems</td>
            <td>North Building 1.22</td>
            <td></td>
            <td>Dr. Helen Brown</td>
          </tr>
          <tr>
            <td>Friday 16:00-17:30</td>
            <td>DEMO-5-3 (practice)</td>
            <td>Operating Systems</td>
            <td>South Building 3.07</td>
            <td></td>
            <td>James Wilson</td>
          </tr>
        </tbody>
      </table>
    `,
  "DEMO-6": `
      <table id="resulttable">
        <tbody>
          <tr>
            <td>Monday 16:00-17:30</td>
            <td>DEMO-6-1 (lecture)</td>
            <td>Computer Networks</td>
            <td>North Building 4.18</td>
            <td></td>
            <td>Prof. Richard Taylor</td>
          </tr>
          <tr>
            <td>Wednesday 10:00-11:30</td>
            <td>DEMO-6-1 (practice)</td>
            <td>Computer Networks</td>
            <td>Network Lab 1</td>
            <td></td>
            <td>Anna Rodriguez</td>
          </tr>
          <tr>
            <td>Tuesday 14:00-15:30</td>
            <td>DEMO-6-2 (lecture)</td>
            <td>Computer Networks</td>
            <td>North Building 4.18</td>
            <td></td>
            <td>Prof. Richard Taylor</td>
          </tr>
          <tr>
            <td>Thursday 16:00-17:30</td>
            <td>DEMO-6-2 (practice)</td>
            <td>Computer Networks</td>
            <td>Network Lab 2</td>
            <td></td>
            <td>Chris Martin</td>
          </tr>
          <tr>
            <td>Wednesday 18:00-19:30</td>
            <td>DEMO-6-3 (lecture)</td>
            <td>Computer Networks</td>
            <td>North Building 4.18</td>
            <td></td>
            <td>Prof. Richard Taylor</td>
          </tr>
          <tr>
            <td>Friday 10:00-11:30</td>
            <td>DEMO-6-3 (practice)</td>
            <td>Computer Networks</td>
            <td>Network Lab 3</td>
            <td></td>
            <td>Diana Clark</td>
          </tr>
        </tbody>
      </table>
    `,
};

export function generateDemoData(subjectCode) {
  return DEMO_SUBJECTS[subjectCode] ?? null;
}
